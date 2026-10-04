"""Index already-migrated academic objects from the private Storage bucket."""
from datetime import datetime, timezone
import hashlib
import json
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Resource


def academic_metadata_from_path(object_path: str) -> tuple[str | None, str | None]:
    """Map paths such as ``chem_100/sem 1/file.pdf`` to portal filters."""
    parts = [part for part in object_path.split("/") if part]
    level = semester = None
    for part in parts[:-1]:
        normalized = re.sub(r"[_-]+", " ", part).strip()
        if level is None:
            match = re.fullmatch(r"(?:chem|level|lvl)\s*(100|200|300|400)", normalized, re.I)
            if match:
                level = match.group(1)
        if semester is None:
            match = re.fullmatch(r"(?:sem|semester)\s*([12])", normalized, re.I)
            if match:
                semester = match.group(1)
    return level, semester


def academic_label(level: str | None, semester: str | None) -> str | None:
    parts = []
    if level:
        parts.append(f"CHEM {level}")
    if semester:
        parts.append(f"Semester {semester}")
    return " · ".join(parts) or None


class StorageResourceIndexer:
    def __init__(self):
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage is not configured.")
        self.bucket = settings.supabase_academic_storage_bucket
        self.base_url = settings.supabase_url.rstrip("/") + "/storage/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
            "Content-Type": "application/json",
        }

    def _list(self, prefix: str = "", offset: int = 0) -> list[dict]:
        payload = json.dumps({"prefix": prefix, "limit": 1000, "offset": offset}).encode()
        request = Request(f"{self.base_url}/object/list/{self.bucket}", data=payload, method="POST", headers=self.headers)
        try:
            with urlopen(request, timeout=60) as response:
                return json.load(response)
        except (HTTPError, URLError) as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not list Academic Storage objects.") from exc

    def object_paths(self) -> list[str]:
        paths: list[str] = []

        def walk(prefix: str = ""):
            offset = 0
            while True:
                entries = self._list(prefix, offset)
                for entry in entries:
                    name = entry.get("name")
                    if not name:
                        continue
                    path = f"{prefix.rstrip('/')}/{name}" if prefix else name
                    # Storage returns directory entries without an object id.
                    if entry.get("id"):
                        paths.append(path)
                    else:
                        walk(path)
                if len(entries) < 1000:
                    break
                offset += len(entries)

        walk()
        return paths

    def index(self, session: Session) -> dict:
        now = datetime.now(timezone.utc)
        paths = self.object_paths()
        seen, created, updated = set(paths), 0, 0
        for object_path in paths:
            record = session.query(Resource).filter_by(
                supabase_bucket=self.bucket, supabase_storage_path=object_path
            ).one_or_none()
            level, semester = academic_metadata_from_path(object_path)
            label = academic_label(level, semester)
            filename = object_path.rsplit("/", 1)[-1]
            folder_path = object_path.rsplit("/", 1)[0] if "/" in object_path else ""
            if record is None:
                stable_id = hashlib.sha256(object_path.encode()).hexdigest()
                record = Resource(
                    name=filename,
                    title=filename,
                    file_name=filename,
                    folder_path=folder_path,
                    google_drive_file_id=f"storage-{stable_id}",
                    resource_type=filename.rsplit(".", 1)[-1].lower() if "." in filename else "other",
                    level=level, semester=semester, label=label,
                    supabase_bucket=self.bucket,
                    supabase_storage_path=object_path,
                    storage_migrated_at=now,
                )
                session.add(record)
                created += 1
            else:
                record.name = record.title = record.file_name = filename
                record.folder_path, record.level, record.semester, record.label = folder_path, level, semester, label
                record.is_active, record.is_missing = True, False
                record.storage_migrated_at = record.storage_migrated_at or now
                updated += 1
        for record in session.query(Resource).filter(
            Resource.supabase_bucket == self.bucket,
            Resource.supabase_storage_path.is_not(None),
            Resource.is_active.is_(True),
        ):
            if record.supabase_storage_path not in seen:
                record.is_missing = True
        session.commit()
        return {"success": True, "objects_indexed": len(paths), "new_resources": created, "updated_resources": updated, "indexed_at": now}
