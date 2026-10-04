"""One-file, non-destructive Google Drive to Supabase Storage migration probe."""
import json
import re
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status

from ..config import get_settings
from ..services.google_drive import FOLDER_MIME, GoogleDriveService, WORKSPACE_EXPORTS


def _safe_segment(value: str) -> str:
    cleaned = re.sub(r"[\\/\x00-\x1f]+", "_", value).strip(". ")
    if not cleaned or cleaned in {".", ".."}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Google Drive contains an unusable path segment.")
    return cleaned


@dataclass(frozen=True)
class MigrationReport:
    google_drive_file: str
    google_drive_file_id: str
    original_path: str
    supabase_bucket: str
    supabase_storage_path: str
    file_size: int
    mime_type: str
    upload_status: str
    verification_status: str
    duplicate_protection: str
    database_record_created: bool = False
    dry_run: bool = False

    def as_dict(self) -> dict:
        return self.__dict__.copy()


class DriveMigrationProbe:
    def __init__(self, drive: GoogleDriveService | None = None):
        self.settings = get_settings()
        if not self.settings.supabase_url or not self.settings.supabase_service_role_key:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase Storage is not configured.")
        if not self.settings.supabase_test_storage_bucket:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Set SUPABASE_TEST_STORAGE_BUCKET to the pre-existing private test bucket.")
        self.drive = drive or GoogleDriveService()
        self.bucket = self.settings.supabase_test_storage_bucket
        self.base_url = self.settings.supabase_url.rstrip("/") + "/storage/v1"
        self.headers = {"Authorization": f"Bearer {self.settings.supabase_service_role_key}", "apikey": self.settings.supabase_service_role_key}

    def _request(self, method: str, path: str, data: bytes | None = None, headers: dict | None = None):
        request = Request(self.base_url + path, data=data, method=method, headers=self.headers | (headers or {}))
        return urlopen(request, timeout=60)

    def _object_info(self, object_path: str) -> dict | None:
        try:
            parent, _, filename = object_path.rpartition("/")
            payload = json.dumps({"prefix": f"{parent}/" if parent else "", "limit": 100, "offset": 0}).encode()
            with self._request("POST", f"/object/list/{self.bucket}", payload, {"Content-Type": "application/json"}) as response:
                objects = json.load(response)
            return next((item for item in objects if item.get("name") == filename and item.get("id")), None)
        except HTTPError as exc:
            if exc.code == 404:
                return None
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not inspect the Supabase test object.") from exc
        except URLError as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not reach Supabase Storage.") from exc

    def run(self, google_drive_file_id: str, dry_run: bool = False) -> MigrationReport:
        item = self.drive.get_metadata(google_drive_file_id)
        if item.get("trashed") or item.get("mimeType") == FOLDER_MIME:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Select one non-trashed academic file, not a folder.")
        # Exported Workspace documents do not have a reliable original byte size;
        # reject them for this test so byte-for-byte verification remains meaningful.
        if item.get("mimeType") in WORKSPACE_EXPORTS or not item.get("size"):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Select a binary Drive file with a reported size (not a Google Workspace export).")
        declared_size = int(item["size"])
        if declared_size <= 0:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Select a non-empty Google Drive file.")
        folders = self.drive.folder_path(item, self.settings.google_drive_root_folder_id)
        filename = _safe_segment(item["name"])
        path_parts = [_safe_segment(part) for part in folders] + [f"drive-file-{item['id']}", filename]
        object_path = "/".join(path_parts)
        original_path = "/".join(folders + [item["name"]])
        existing = self._object_info(object_path)
        common = dict(google_drive_file=item["name"], google_drive_file_id=item["id"], original_path=original_path,
                      supabase_bucket=self.bucket, supabase_storage_path=object_path, file_size=declared_size,
                      mime_type=item.get("mimeType") or "application/octet-stream")
        if existing:
            size = (existing.get("metadata") or {}).get("size")
            verified = int(size) == declared_size if size is not None else False
            return MigrationReport(**common, upload_status="skipped: already migrated", verification_status="verified" if verified else "existing object size could not be verified", duplicate_protection="matched Drive-ID storage path; no upload attempted")
        if dry_run:
            return MigrationReport(**common, upload_status="dry run: would upload", verification_status="not run", duplicate_protection="Drive-ID storage path checked; no object exists", dry_run=True)
        chunks, mime_type = self.drive.file_chunks(item["id"], item.get("mimeType"))
        contents = b"".join(chunks)
        if len(contents) != declared_size:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Downloaded byte count does not match Google Drive metadata; upload was not attempted.")
        try:
            with self._request("POST", f"/object/{self.bucket}/{object_path}", contents, {"Content-Type": mime_type, "x-upsert": "false"}):
                pass
        except HTTPError as exc:
            if exc.code not in {400, 409} or not self._object_info(object_path):
                raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Supabase test upload failed.") from exc
        info = self._object_info(object_path)
        if not info or int((info.get("metadata") or {}).get("size", -1)) != declared_size:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Supabase object verification failed.")
        # A one-byte ranged request confirms the private object is retrievable by
        # the existing server credential without making its bucket public.
        try:
            with self._request("GET", f"/object/{self.bucket}/{object_path}", headers={"Range": "bytes=0-0"}) as response:
                if not response.read(1): raise ValueError("empty retrieval")
        except (HTTPError, URLError, ValueError) as exc:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Supabase object retrieval verification failed.") from exc
        common["mime_type"] = mime_type
        return MigrationReport(**common, upload_status="uploaded", verification_status="exists, size matches, and is retrievable", duplicate_protection="Drive-ID storage path; upsert disabled", )
