"""Small Supabase Storage adapter; database records retain only the resulting URL."""
import mimetypes
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import quote
from collections.abc import Iterator
from fastapi import HTTPException, UploadFile, status
from .config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_ACADEMIC_FILE_BYTES = 50 * 1024 * 1024
PROFILE_IMAGE_SUFFIXES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


def _valid_image_signature(contents: bytes, content_type: str) -> bool:
    if content_type == "image/jpeg":
        return contents.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return contents.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP"
    return False


def upload_academic_object(object_path: str, contents: bytes, content_type: str) -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage is not configured.")
    if not contents or len(contents) > MAX_ACADEMIC_FILE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Academic files must be between 1 byte and 50 MB.")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_academic_storage_bucket}/{object_path}"
    request = Request(url, data=contents, method="POST", headers={"Authorization": f"Bearer {settings.supabase_service_role_key}", "apikey": settings.supabase_service_role_key, "Content-Type": content_type or "application/octet-stream", "x-upsert": "false"})
    try:
        urlopen(request, timeout=90).read()
    except HTTPError as exc:
        if exc.code in {400, 409}:
            raise HTTPException(status.HTTP_409_CONFLICT, "An academic object already exists at this path.") from exc
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage upload failed.") from exc
    except URLError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage is unavailable.") from exc


def academic_file_chunks(bucket: str, object_path: str) -> Iterator[bytes]:
    """Stream a private academic object using the existing server credential."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage is not configured.")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{object_path}"
    request = Request(url, headers={"Authorization": f"Bearer {settings.supabase_service_role_key}", "apikey": settings.supabase_service_role_key})
    try:
        response = urlopen(request, timeout=60)
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage retrieval failed.") from exc
    def generate():
        with response:
            while data := response.read(1024 * 1024):
                yield data
    return generate()

async def upload_directory_image(file: UploadFile) -> str:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(503, "Image uploads are not configured.")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are accepted.")
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image must be between 1 byte and 5 MB.")
    if not _valid_image_signature(contents, file.content_type):
        raise HTTPException(400, "The uploaded file is not a valid image.")
    suffix = Path(file.filename or "image").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Image filename has an unsupported extension.")
    key = f"directory/{uuid.uuid4()}{suffix}"
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{key}"
    request = Request(url, data=contents, method="POST", headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
        "Content-Type": file.content_type,
        "x-upsert": "false",
    })
    try:
        urlopen(request, timeout=20).read()
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Image upload failed.") from exc
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/{key}"


async def upload_profile_image(file: UploadFile, user_id: str) -> tuple[str, str]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Profile photos are unavailable.")
    content_type = (file.content_type or "").lower()
    suffix = PROFILE_IMAGE_SUFFIXES.get(content_type)
    if not suffix:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPEG, PNG, and WebP images are accepted.")
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Profile photos must be between 1 byte and 5 MB.")
    if not _valid_image_signature(contents, content_type):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is not a valid image.")

    key = f"profiles/{user_id}/{uuid.uuid4()}{suffix}"
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_profile_storage_bucket}/{key}"
    request = Request(url, data=contents, method="POST", headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
        "Content-Type": content_type,
        "x-upsert": "false",
    })
    try:
        urlopen(request, timeout=20).read()
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Profile photo upload failed.") from exc
    return key, content_type


def delete_profile_image(object_path: str) -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Profile photos are unavailable.")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_profile_storage_bucket}/{quote(object_path, safe='/')}"
    request = Request(url, method="DELETE", headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    })
    try:
        urlopen(request, timeout=20).read()
    except HTTPError as exc:
        if exc.code != 404:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Profile photo removal failed.") from exc
    except URLError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Profile photo removal failed.") from exc


def profile_image_chunks(object_path: str) -> Iterator[bytes]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Profile photos are unavailable.")
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_profile_storage_bucket}/{quote(object_path, safe='/')}"
    request = Request(url, headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    })
    try:
        response = urlopen(request, timeout=20)
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Profile photo is unavailable.") from exc

    def generate():
        with response:
            while data := response.read(256 * 1024):
                yield data
    return generate()
