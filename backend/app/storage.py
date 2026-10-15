"""Server-side Supabase Storage adapter for directory images and academic objects."""
import json
import mimetypes
import uuid
import zipfile
from io import BytesIO
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from collections.abc import Iterator
from fastapi import HTTPException, UploadFile, status
from .config import get_settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_ACADEMIC_FILE_BYTES = 50 * 1024 * 1024
MAX_OFFICE_UNCOMPRESSED_BYTES = 250 * 1024 * 1024
MAX_OFFICE_ARCHIVE_ENTRIES = 5_000

ACADEMIC_MIME_TYPES = {
    ".bmp": "image/bmp",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt": "text/plain",
    ".webp": "image/webp",
}


def validate_academic_upload(filename: str, contents: bytes) -> str:
    """Validate supported academic files by extension and file signature."""
    suffix = Path(filename).suffix.lower()
    mime_type = ACADEMIC_MIME_TYPES.get(suffix)
    if not mime_type:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Use PDF, Word, PowerPoint, text, CSV, or a supported image file.",
        )

    valid = False
    if suffix == ".pdf":
        valid = b"%PDF-" in contents[:1024]
    elif suffix in {".doc", ".ppt"}:
        valid = contents.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    elif suffix in {".docx", ".pptx"}:
        try:
            with zipfile.ZipFile(BytesIO(contents)) as archive:
                entries = archive.infolist()
                names = {entry.filename for entry in entries}
                expected_part = "word/document.xml" if suffix == ".docx" else "ppt/presentation.xml"
                valid = (
                    "[Content_Types].xml" in names
                    and expected_part in names
                    and len(entries) <= MAX_OFFICE_ARCHIVE_ENTRIES
                    and sum(entry.file_size for entry in entries) <= MAX_OFFICE_UNCOMPRESSED_BYTES
                    and not any(entry.flag_bits & 1 for entry in entries)
                )
        except (zipfile.BadZipFile, OSError):
            valid = False
    elif suffix == ".png":
        valid = contents.startswith(b"\x89PNG\r\n\x1a\n")
    elif suffix in {".jpg", ".jpeg"}:
        valid = contents.startswith(b"\xff\xd8\xff")
    elif suffix == ".gif":
        valid = contents.startswith((b"GIF87a", b"GIF89a"))
    elif suffix == ".webp":
        valid = len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP"
    elif suffix == ".bmp":
        valid = contents.startswith(b"BM")
    elif suffix in {".txt", ".csv", ".md"}:
        try:
            contents.decode("utf-8-sig")
            valid = True
        except UnicodeDecodeError:
            valid = False

    if not valid:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "The file contents do not match a valid supported academic file.",
        )
    return mime_type


def academic_object_url(bucket: str, object_path: str) -> str:
    """Build a Storage object URL without treating characters in a file path as URL syntax.

    Folder and file names commonly contain spaces, ``#``, or non-ASCII characters.
    Preserve the Storage path separators while encoding every other URL-sensitive
    character, otherwise urllib rejects paths such as ``SEM 1/lecture notes.pdf``.
    """
    settings = get_settings()
    return (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/"
        f"{quote(bucket, safe='')}/{quote(object_path, safe='/')}"
    )


def upload_academic_object(object_path: str, contents: bytes, content_type: str) -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage is not configured.")
    if not contents or len(contents) > MAX_ACADEMIC_FILE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Academic files must be between 1 byte and 50 MB.")
    url = academic_object_url(settings.supabase_academic_storage_bucket, object_path)
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
    url = academic_object_url(bucket, object_path)
    request = Request(url, headers={"Authorization": f"Bearer {settings.supabase_service_role_key}", "apikey": settings.supabase_service_role_key})
    try:
        response = urlopen(request, timeout=60)
    except HTTPError as exc:
        if exc.code == 404:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "This file is no longer available in Academic Storage.") from exc
        if exc.code in {401, 403}:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage access is not configured correctly.") from exc
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage retrieval failed.") from exc
    except URLError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage is unavailable.") from exc
    def generate():
        with response:
            while data := response.read(1024 * 1024):
                yield data
    return generate()


def create_academic_signed_url(
    bucket: str,
    object_path: str,
    *,
    expires_in: int = 60,
    download_filename: str | None = None,
) -> str:
    """Create a short-lived private URL so browsers can stream downloads directly."""
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Academic Storage is not configured.")

    url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/"
        f"{quote(bucket, safe='')}/{quote(object_path, safe='/')}"
    )
    payload: dict[str, int | str] = {"expiresIn": expires_in}
    if download_filename:
        payload["download"] = download_filename
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            result = json.load(response)
    except (HTTPError, URLError, json.JSONDecodeError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage download could not be prepared.") from exc

    signed_path = result.get("signedURL") or result.get("signedUrl")
    if not isinstance(signed_path, str) or not signed_path:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage download could not be prepared.")
    signed_url = urljoin(f"{settings.supabase_url.rstrip('/')}/", signed_path)
    signed_origin = urlparse(signed_url)
    configured_origin = urlparse(settings.supabase_url)
    if (signed_origin.scheme, signed_origin.netloc) != (configured_origin.scheme, configured_origin.netloc):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Academic Storage returned an invalid download link.")
    return signed_url

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
