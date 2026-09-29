import math
import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Resource, ResourceFolder, User
from ..resource_schemas import FolderOut, ResourceOut, ResourcePage, ResourceUpdate, SyncSummary
from ..security import get_current_user, require_admin
from ..services.google_drive import GoogleDriveService
from ..services.resource_sync import sync_resources

router = APIRouter(prefix="/api/resources", tags=["Resources"])
DB = Annotated[Session, Depends(get_db)]
Authenticated = Annotated[User, Depends(get_current_user)]
Admin = Annotated[User, Depends(require_admin)]


def get_resource(resource_id: int, session: Session) -> Resource:
    resource = session.get(Resource, resource_id)
    if not resource or not resource.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    return resource


@router.get("/health", summary="Resource repository health")
def resources_health():
    """Configuration-only check; it never returns credentials or contacts Drive."""
    return {"status": "ok", "google_drive_configured": bool(get_settings().google_drive_root_folder_id)}


@router.get("/folders", response_model=list[FolderOut], summary="List indexed Drive folders")
def list_folders(session: DB, _: Authenticated):
    return session.query(ResourceFolder).filter(ResourceFolder.is_active.is_(True)).order_by(ResourceFolder.folder_path).all()


@router.get("/search", response_model=ResourcePage, summary="Search indexed resources")
def search_resources(session: DB, user: Authenticated, q: str = Query(min_length=1, max_length=200), page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    return list_resources(session, user, page, page_size, search=q)


@router.post("/sync", response_model=SyncSummary, summary="Admin-only Google Drive synchronization")
def synchronize_resources(session: DB, _: Admin):
    root_id = get_settings().google_drive_root_folder_id
    if not root_id: raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google Drive repository is not configured.")
    return sync_resources(session, root_id)


@router.get("", response_model=ResourcePage, summary="Browse active academic resources")
def list_resources(session: DB, _: Authenticated, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), course: str | None = None, course_code: str | None = None, level: str | None = None, category: str | None = None, resource_type: str | None = None, folder: str | None = None, semester: str | None = None, academic_year: str | None = None, department: str | None = None, sort_by: str = Query("name", pattern="^(name|created_at|last_modified_drive)$"), sort_order: str = Query("asc", pattern="^(asc|desc)$"), search: str | None = Query(None, max_length=200)):
    query = session.query(Resource).filter(Resource.is_active.is_(True))
    if course: query = query.filter(Resource.course_name.ilike(f"%{course}%"))
    if course_code: query = query.filter(Resource.course_code.ilike(f"%{course_code}%"))
    if level: query = query.filter(Resource.level == level)
    if category: query = query.filter(Resource.category == category)
    if resource_type: query = query.filter(Resource.resource_type == resource_type)
    if folder: query = query.filter(Resource.folder_path.ilike(f"%{folder}%"))
    if semester: query = query.filter(Resource.semester == semester)
    if academic_year: query = query.filter(Resource.academic_year == academic_year)
    if department: query = query.filter(Resource.department.ilike(f"%{department}%"))
    if search:
        escaped = re.sub(r"([%_])", r"\\\1", search)
        pattern = f"%{escaped}%"
        query = query.filter(or_(Resource.name.ilike(pattern), Resource.course_code.ilike(pattern), Resource.course_name.ilike(pattern), Resource.description.ilike(pattern), Resource.category.ilike(pattern), Resource.folder_path.ilike(pattern)))
    sort_column = getattr(Resource, sort_by)
    total = query.count(); items = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": math.ceil(total / page_size) if total else 0}


@router.get("/{resource_id}", response_model=ResourceOut)
def resource_detail(resource_id: int, session: DB, _: Authenticated): return get_resource(resource_id, session)


@router.get("/{resource_id}/view", summary="Open a resource in Google Drive")
def view_resource(resource_id: int, session: DB, _: Authenticated):
    resource = get_resource(resource_id, session)
    # Stream through the authenticated API so a private service-account share is
    # sufficient; the student's browser never needs Drive credentials.
    chunks, media_type = GoogleDriveService().file_chunks(resource.google_drive_file_id, resource.mime_type)
    filename = re.sub(r"[\\/:*?\"<>|\r\n]+", "_", resource.name).strip(". ") or "resource"
    return StreamingResponse(chunks, media_type=media_type, headers={"Content-Disposition": f"inline; filename*=UTF-8''{filename}"})


@router.get("/{resource_id}/download", summary="Stream a resource from Google Drive")
def download_resource(resource_id: int, session: DB, _: Authenticated):
    resource = get_resource(resource_id, session)
    if not resource.download_available: raise HTTPException(status.HTTP_403_FORBIDDEN, "Downloads are disabled for this resource.")
    chunks, media_type = GoogleDriveService().file_chunks(resource.google_drive_file_id, resource.mime_type)
    filename = re.sub(r"[\\/:*?\"<>|\r\n]+", "_", resource.name).strip(". ") or "resource"
    return StreamingResponse(chunks, media_type=media_type, headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"})


@router.patch("/{resource_id}", response_model=ResourceOut, summary="Admin-only resource metadata update")
def update_resource(resource_id: int, payload: ResourceUpdate, session: DB, _: Admin):
    resource = session.get(Resource, resource_id)
    if not resource: raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(resource, field, value)
    session.commit(); session.refresh(resource); return resource
