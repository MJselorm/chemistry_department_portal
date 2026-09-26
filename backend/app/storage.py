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


def _detected_image_type(contents: bytes) -> str | None:
    if contents.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP":
        return "image/webp"
    return None

async def upload_directory_image(file: UploadFile) -> str:
    declared_type = (file.content_type or "").split(";", 1)[0].lower()
    if declared_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are accepted.")
    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if not contents or len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "Image must be between 1 byte and 5 MB.")
    suffix = Path(file.filename or "image").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(400, "Image filename has an unsupported extension.")
    suffix_type = "image/jpeg" if suffix in {".jpg", ".jpeg"} else f"image/{suffix[1:]}"
    detected_type = _detected_image_type(contents)
    if detected_type != declared_type or detected_type != suffix_type:
        raise HTTPException(400, "Image content does not match its declared type and extension.")
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(503, "Image uploads are not configured.")
    key = f"directory/{uuid.uuid4()}{suffix}"
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_storage_bucket}/{key}"
    request = Request(url, data=contents, method="POST", headers={
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": file.content_type,
        "x-upsert": "false",
    })
    try:
        with urlopen(request, timeout=20) as response:
            response.read()
    except (HTTPError, URLError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Image upload failed.") from exc
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_storage_bucket}/{key}"
