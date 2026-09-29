import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..models import Resource, ResourceFolder
from .google_drive import FOLDER_MIME, GoogleDriveService

log = logging.getLogger(__name__)


def _level(path: str) -> str | None:
    import re
    match = re.search(r"(?:level|lvl)\s*(\d{3})", path, re.I)
    return match.group(1) if match else None


def _drive_time(value: str | None):
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def sync_resources(session: Session, root_folder_id: str) -> dict:
    drive, now = GoogleDriveService(), datetime.now(timezone.utc)
    seen_files, seen_folders = set(), set()
    summary = {"success": True, "folders_scanned": 0, "files_scanned": 0, "new_resources": 0, "updated_resources": 0, "unchanged_resources": 0, "missing_resources": 0, "sync_completed_at": now}

    def scan(folder_id: str, parent_id: str | None, path: str):
        seen_folders.add(folder_id); summary["folders_scanned"] += 1
        folder = session.query(ResourceFolder).filter_by(google_drive_folder_id=folder_id).one_or_none()
        if not folder:
            folder = ResourceFolder(google_drive_folder_id=folder_id, parent_drive_folder_id=parent_id, name=path.rsplit("/", 1)[-1], folder_path=path, level=_level(path)); session.add(folder)
        else:
            folder.parent_drive_folder_id, folder.folder_path, folder.level, folder.is_active = parent_id, path, _level(path), True
        folder.last_synced_at = now
        for item in drive.list_children(folder_id):
            child_path = f"{path}/{item['name']}"
            if item["mimeType"] == FOLDER_MIME:
                scan(item["id"], folder_id, child_path); continue
            seen_files.add(item["id"]); summary["files_scanned"] += 1
            record = session.query(Resource).filter_by(google_drive_file_id=item["id"]).one_or_none()
            values = dict(name=item["name"], title=item["name"], file_name=item["name"], folder_path=path, google_drive_parent_id=folder_id, mime_type=item.get("mimeType"), file_size=int(item["size"]) if item.get("size") else None, web_view_link=item.get("webViewLink"), web_content_link=item.get("webContentLink"), last_modified_drive=_drive_time(item.get("modifiedTime")), last_synced_at=now, is_active=True, is_missing=False)
            if record is None:
                session.add(Resource(google_drive_file_id=item["id"], resource_type=(item.get("mimeType") or "other").split("/")[-1], **values)); summary["new_resources"] += 1
            else:
                changed = any(getattr(record, key) != value for key, value in values.items() if key != "last_synced_at")
                for key, value in values.items(): setattr(record, key, value)
                summary["updated_resources" if changed else "unchanged_resources"] += 1
    try:
        scan(root_folder_id, None, "")
        for record in session.query(Resource).filter(Resource.is_active.is_(True)).all():
            if record.google_drive_file_id not in seen_files:
                record.is_missing = True
                summary["missing_resources"] += 1
        for folder in session.query(ResourceFolder).filter(ResourceFolder.is_active.is_(True)).all():
            if folder.google_drive_folder_id not in seen_folders: folder.is_active = False
        session.commit(); log.info("Resource Drive sync completed: %s", summary); return summary
    except Exception:
        session.rollback(); log.exception("Resource Drive sync failed"); raise
