"""Resumable migration of the configured public academic Drive into private Storage.

Run from ``backend``: ``python scripts/migrate_public_drive.py``.  It makes no
Google Drive mutations and is safe to rerun: Drive file IDs are part of every
object path and existing objects are never overwritten.
"""
import html
import json
import mimetypes
import re
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

# Allow direct execution from the backend directory without packaging a second app.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.database import SessionLocal
from app.models import Resource, ResourceFolder

ROOT_FOLDER_ID = "1sPuS7WLpY5k-n_YL7jj6AQs4EiOfrJfq"
USER_AGENT = "ChemistryHubMigration/1.0"


def clean_name(value: str, is_folder: bool = False) -> str:
    if is_folder:
        return value.removesuffix(" Shared folder")
    # Drive's public listing appends a rendered type label (for example " PDF").
    match = re.match(
        r"(?i)^(.+\.[a-z0-9]{1,8})\s+(?:pdf|docx?|pptx?|xlsx?|zip|txt|microsoft (?:powerpoint|word|excel)|image|video)$",
        value,
    )
    return match.group(1) if match else value


def segment(value: str) -> str:
    return re.sub(r"[\\/\x00-\x1f]+", "_", value).strip(". ") or "unnamed"


def public_children(folder_id: str) -> list[tuple[str, str, bool]]:
    url = f"https://drive.google.com/drive/folders/{folder_id}?usp=drive_link"
    with open_with_retry(Request(url, headers={"User-Agent": USER_AGENT}), timeout=60) as response:
        page = response.read().decode("utf-8", "replace")
    result, seen = [], set()
    for match in re.finditer(r'data-id="([A-Za-z0-9_-]{20,})"', page):
        item_id = match.group(1)
        tooltip = re.search(r'data-tooltip="([^"]+)"', page[match.end():match.end() + 900])
        if not tooltip or item_id in seen:
            continue
        seen.add(item_id)
        raw_name = html.unescape(tooltip.group(1))
        is_folder = raw_name.endswith(" Shared folder")
        result.append((item_id, clean_name(raw_name, is_folder), is_folder))
    return result


def open_with_retry(request: Request, timeout: int):
    """Retry temporary DNS/socket failures for either public Drive or Storage."""
    for attempt in range(5):
        try:
            return urlopen(request, timeout=timeout)
        except URLError:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)


def main() -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase configuration is required.")
    bucket = settings.supabase_academic_storage_bucket
    base = settings.supabase_url.rstrip("/") + "/storage/v1"
    auth = {"Authorization": f"Bearer {settings.supabase_service_role_key}", "apikey": settings.supabase_service_role_key}

    def storage(method: str, suffix: str, data: bytes | None = None, headers: dict | None = None):
        """Retry transient DNS/socket failures; never retry an HTTP response."""
        request = Request(base + suffix, data=data, method=method, headers=auth | (headers or {}))
        return open_with_retry(request, timeout=180)

    def existing(path: str) -> dict | None:
        parent, filename = path.rsplit("/", 1)
        body = json.dumps({"prefix": parent + "/", "limit": 100, "offset": 0}).encode()
        with storage("POST", f"/object/list/{bucket}", body, {"Content-Type": "application/json"}) as response:
            return next((item for item in json.load(response) if item.get("name") == filename and item.get("id")), None)

    queue = deque([(ROOT_FOLDER_ID, "", None)])
    folders: list[tuple[str, str, str | None]] = []
    files: list[tuple[str, str, str, str]] = []
    while queue:
        folder_id, folder_path, parent_id = queue.popleft()
        folders.append((folder_id, folder_path, parent_id))
        for child_id, name, is_folder in public_children(folder_id):
            child_path = f"{folder_path}/{name}".strip("/")
            if is_folder:
                queue.append((child_id, child_path, folder_id))
            else:
                files.append((child_id, child_path, folder_id, name))
    print(f"Inventory: {len(folders)} folders, {len(files)} files", flush=True)

    completed = skipped = failed = 0
    now = datetime.now(timezone.utc)
    with SessionLocal() as session:
        for folder_id, folder_path, parent_id in folders:
            folder = session.query(ResourceFolder).filter_by(google_drive_folder_id=folder_id).one_or_none()
            values = dict(parent_drive_folder_id=parent_id, name=folder_path.rsplit("/", 1)[-1] if folder_path else "THE CATALYST SHELF", folder_path=folder_path, is_active=True, last_synced_at=now)
            if folder is None:
                session.add(ResourceFolder(google_drive_folder_id=folder_id, level=None, **values))
            else:
                for key, value in values.items(): setattr(folder, key, value)
        session.commit()

        for number, (file_id, full_path, parent_id, filename) in enumerate(files, 1):
            directory = full_path.rsplit("/", 1)[0] if "/" in full_path else ""
            object_path = "/".join([*(segment(item) for item in directory.split("/") if item), f"drive-file-{file_id}", segment(filename)])
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            phase = "checking destination"
            try:
                object_info = existing(object_path)
                if object_info is None:
                    phase = "downloading public Drive file"
                    source = "https://drive.usercontent.google.com/download?" + urlencode({"id": file_id, "export": "download", "confirm": "t"})
                    with open_with_retry(Request(source, headers={"User-Agent": USER_AGENT}), timeout=180) as response:
                        contents = response.read()
                    if not contents or (filename.lower().endswith(".pdf") and not contents.startswith(b"%PDF-")):
                        raise RuntimeError("public download validation failed")
                    phase = "uploading to Supabase Storage"
                    try:
                        with storage("POST", f"/object/{bucket}/{quote(object_path, safe='/')}", contents, {"Content-Type": mime_type, "x-upsert": "false"}):
                            pass
                    except HTTPError as exc:
                        # A retry may race with an earlier process. Only treat it
                        # as success if the exact Drive-ID object now exists.
                        object_info = existing(object_path)
                        if object_info is None:
                            detail = exc.read(1000).decode("utf-8", "replace")
                            raise RuntimeError(f"Supabase upload HTTP {exc.code}: {detail}") from exc
                    object_info = existing(object_path)
                    if not object_info or int((object_info.get("metadata") or {}).get("size", -1)) != len(contents):
                        raise RuntimeError("Storage verification failed")
                    completed += 1
                else:
                    skipped += 1
                size = int((object_info.get("metadata") or {}).get("size", 0))
                record = session.query(Resource).filter_by(google_drive_file_id=file_id).one_or_none()
                values = dict(name=filename, title=filename, file_name=filename, folder_path=directory, google_drive_parent_id=parent_id, mime_type=mime_type, file_size=size, web_view_link=f"https://drive.google.com/file/d/{file_id}/view", resource_type=mime_type.split("/")[-1], supabase_bucket=bucket, supabase_storage_path=object_path, storage_migrated_at=now, is_active=True, is_missing=False, last_synced_at=now)
                if record is None:
                    session.add(Resource(google_drive_file_id=file_id, **values))
                else:
                    for key, value in values.items(): setattr(record, key, value)
                session.commit()
            except Exception as exc:
                session.rollback()
                failed += 1
                print(f"FAILED [{phase}] {file_id} {filename}: {type(exc).__name__}: {exc}", flush=True)
            if number % 10 == 0 or number == len(files):
                print(f"Progress {number}/{len(files)}; uploaded={completed}, existing={skipped}, failed={failed}", flush=True)
    print(f"Complete: uploaded={completed}, existing={skipped}, failed={failed}")


if __name__ == "__main__":
    main()
