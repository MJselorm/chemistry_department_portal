import math
import mimetypes
import re
import uuid
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Resource, ResourceFolder, User
from ..resource_schemas import FolderOut, ResourceOut, ResourcePage, ResourceUpdate, StorageIndexSummary
from ..security import get_current_user, require_admin
from ..services.storage_index import StorageResourceIndexer
from ..storage import (
    MAX_ACADEMIC_FILE_BYTES,
    academic_file_chunks,
    create_academic_signed_url,
    upload_academic_object,
    validate_academic_upload,
)

router = APIRouter(prefix="/api/resources", tags=["Resources"])
DB = Annotated[Session, Depends(get_db)]
Authenticated = Annotated[User, Depends(get_current_user)]
Admin = Annotated[User, Depends(require_admin)]


def get_resource(resource_id: int, session: Session) -> Resource:
    resource = session.get(Resource, resource_id)
    if not resource or not resource.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    return resource


def require_storage_location(resource: Resource) -> tuple[str, str]:
    if not resource.supabase_bucket or not resource.supabase_storage_path:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "This resource has not been indexed in Academic Storage. Ask an administrator to refresh the storage index.",
        )
    return resource.supabase_bucket, resource.supabase_storage_path


@router.get("/health", summary="Resource repository health")
def resources_health(_: Authenticated):
    """Configuration-only check; it never returns credentials or object paths."""
    settings = get_settings()
    return {
        "status": "ok" if settings.supabase_url and settings.supabase_service_role_key else "not_configured",
        "access_mode": "authenticated_server_proxy",
    }


@router.get("/folders", response_model=list[FolderOut], summary="List indexed Academic Storage folders")
def list_folders(session: DB, _: Authenticated):
    return session.query(ResourceFolder).filter(ResourceFolder.is_active.is_(True)).order_by(ResourceFolder.folder_path).all()


@router.get("/search", response_model=ResourcePage, summary="Search indexed resources")
def search_resources(session: DB, user: Authenticated, q: str = Query(min_length=1, max_length=200), page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100)):
    return list_resources(session, user, page, page_size, search=q)


@router.post("/storage-index", response_model=StorageIndexSummary, summary="Admin-only Academic Storage indexing")
def index_migrated_storage(session: DB, _: Admin):
    """Index files already present in Academic Storage; no uploads or deletes occur."""
    return StorageResourceIndexer().index(session)


@router.post("/upload", response_model=ResourceOut, summary="Admin-only academic file upload")
async def upload_resource(file: Annotated[UploadFile, File(...)], _: Admin, session: DB, name: Annotated[str | None, Form()] = None, folder_path: Annotated[str, Form()] = "admin-uploads", category: Annotated[str | None, Form()] = None, course_code: Annotated[str | None, Form()] = None, level: Annotated[str | None, Form()] = None):
    filename = re.sub(r"[\\/:*?\"<>|\r\n]+", "_", file.filename or "resource").strip(". ")
    if not filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A valid filename is required.")
    safe_folder = "/".join(re.sub(r"[\\\x00-\x1f]+", "_", part).strip(". ") for part in folder_path.split("/") if part.strip(". ")) or "admin-uploads"
    contents = await file.read(MAX_ACADEMIC_FILE_BYTES + 1)
    if len(contents) > MAX_ACADEMIC_FILE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Academic files must be 50 MB or smaller.")
    object_path = f"{safe_folder}/admin-file-{uuid.uuid4()}/{filename}"
    mime_type = validate_academic_upload(filename, contents)
    upload_academic_object(object_path, contents, mime_type)
    record = Resource(name=name or filename, title=name or filename, file_name=filename, folder_path=safe_folder, mime_type=mime_type, file_size=len(contents), resource_type=mime_type.split("/")[-1], category=category, course_code=course_code, level=level, supabase_bucket=get_settings().supabase_academic_storage_bucket, supabase_storage_path=object_path)
    session.add(record); session.commit(); session.refresh(record)
    return record


@router.get("", response_model=ResourcePage, summary="Browse active academic resources")
def list_resources(session: DB, user: Authenticated, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), course: str | None = None, course_code: str | None = None, level: str | None = None, category: str | None = None, resource_type: str | None = None, folder: str | None = None, semester: str | None = None, academic_year: str | None = None, department: str | None = None, sort_by: str = Query("name", pattern="^(name|created_at|updated_at)$"), sort_order: str = Query("asc", pattern="^(asc|desc)$"), search: str | None = Query(None, max_length=200), include_inactive: bool = Query(False)):
    query = session.query(Resource).filter(Resource.supabase_bucket.is_not(None), Resource.supabase_storage_path.is_not(None))
    if not (user.role == "admin" and include_inactive):
        # Students see only files that have completed migration into Storage.
        query = query.filter(Resource.is_active.is_(True), Resource.is_missing.is_(False), Resource.supabase_storage_path.is_not(None))
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
        query = query.filter(or_(Resource.name.ilike(pattern), Resource.label.ilike(pattern), Resource.course_code.ilike(pattern), Resource.course_name.ilike(pattern), Resource.description.ilike(pattern), Resource.category.ilike(pattern), Resource.folder_path.ilike(pattern)))
    sort_column = getattr(Resource, sort_by)
    total = query.count(); items = query.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "page": page, "page_size": page_size, "total": total, "total_pages": math.ceil(total / page_size) if total else 0}


@router.get("/{resource_id}", response_model=ResourceOut)
def resource_detail(resource_id: int, session: DB, _: Authenticated): return get_resource(resource_id, session)


@router.get("/{resource_id}/view", summary="Stream a resource for browser preview")
def view_resource(resource_id: int, session: DB, _: Authenticated):
    return _storage_response(get_resource(resource_id, session), "inline")


@router.get("/{resource_id}/download", summary="Download a resource from Academic Storage")
def download_resource(resource_id: int, session: DB, _: Authenticated):
    resource = get_resource(resource_id, session)
    if not resource.download_available:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Downloads are disabled for this resource.")
    return _storage_response(resource, "attachment")


@router.get("/{resource_id}/download-link", summary="Create a short-lived Academic Storage download link")
def resource_download_link(resource_id: int, response: Response, session: DB, _: Authenticated):
    resource = get_resource(resource_id, session)
    if not resource.download_available:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Downloads are disabled for this resource.")
    bucket, object_path = require_storage_location(resource)
    filename = re.sub(r"[\\/:*?\"<>|\r\n]+", "_", resource.file_name or resource.name).strip(". ") or "resource"
    response.headers["Cache-Control"] = "private, no-store"
    return {
        "url": create_academic_signed_url(
            bucket,
            object_path,
            expires_in=60,
            download_filename=filename,
        ),
        "expires_in": 60,
    }


def _storage_response(resource: Resource, disposition: str) -> StreamingResponse:
    bucket, object_path = require_storage_location(resource)
    filename = re.sub(r"[\\/:*?\"<>|\r\n]+", "_", resource.file_name or resource.name).strip(". ") or "resource"
    mime_type = resource.mime_type
    guessed_mime_type = mimetypes.guess_type(filename)[0]
    # Prefer the filename for browser-native formats when a migrated record
    # still holds stale or generic repository metadata.
    if guessed_mime_type and (
        not mime_type
        or mime_type == "application/octet-stream"
        or guessed_mime_type == "application/pdf"
        or guessed_mime_type.startswith("image/")
    ):
        mime_type = guessed_mime_type
    if not mime_type:
        mime_type = "application/octet-stream"
    headers = {
        "Cache-Control": "private, no-store",
        "Content-Disposition": f"{disposition}; filename*=UTF-8''{quote(filename, safe='')}",
    }
    if resource.file_size is not None:
        headers["Content-Length"] = str(resource.file_size)
    return StreamingResponse(academic_file_chunks(bucket, object_path), media_type=mime_type, headers=headers)


@router.patch("/{resource_id}", response_model=ResourceOut, summary="Admin-only resource metadata update")
def update_resource(resource_id: int, payload: ResourceUpdate, session: DB, _: Admin):
    resource = session.get(Resource, resource_id)
    if not resource: raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(resource, field, value)
    session.commit(); session.refresh(resource); return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Admin-only remove resource from the portal")
def remove_resource(resource_id: int, session: DB, _: Admin):
    resource = session.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    # Keep the private object intact for safe recovery; administrators can restore
    # it with PATCH {"is_active": true}.
    resource.is_active = False
    session.commit()
