"""Small Supabase Storage adapter; database records retain only the resulting URL."""
import mimetypes
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from fastapi import HTTPException, UploadFile, status
from .config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

async def upload_directory_image(file: UploadFile) -> str:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(503, "Image uploads are not configured.")
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are accepted.")
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image must be between 1 byte and 5 MB.")
    suffix = Path(file.filename or "image").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Image filename has an unsupported extension.")
    key = f"directory/{uuid.uuid4()}{suffix}"
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{key}"
    request = Request(url, data=contents, method="POST", headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": file.content_type,
        "x-upsert": "false",
    })
    try:
        urlopen(request, timeout=20).read()
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Image upload failed.") from exc
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/{key}"
