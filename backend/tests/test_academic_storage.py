import io
import json
import zipfile
from types import SimpleNamespace
from urllib.error import HTTPError

import pytest
from fastapi import HTTPException

from app import storage


def test_academic_object_url_encodes_special_object_path_characters(monkeypatch):
    monkeypatch.setattr(storage, "get_settings", lambda: SimpleNamespace(supabase_url="https://example.supabase.co"))

    url = storage.academic_object_url("academic-resources", "level 100/notes #1.pdf")

    assert url.endswith("/academic-resources/level%20100/notes%20%231.pdf")


def test_missing_academic_object_returns_a_helpful_not_found_error(monkeypatch):
    monkeypatch.setattr(
        storage,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://example.supabase.co",
            supabase_service_role_key="server-only-key",
        ),
    )

    def missing(*_args, **_kwargs):
        raise HTTPError("https://example.supabase.co/file", 404, "Not Found", None, None)

    monkeypatch.setattr(storage, "urlopen", missing)

    with pytest.raises(HTTPException) as exc_info:
        storage.academic_file_chunks("academic-resources", "level-100/missing.pdf")

    assert exc_info.value.status_code == 404
    assert "no longer available" in exc_info.value.detail


def test_academic_upload_validation_checks_real_file_signatures():
    assert storage.validate_academic_upload("notes.pdf", b"%PDF-1.7\n") == "application/pdf"

    with pytest.raises(HTTPException) as exc_info:
        storage.validate_academic_upload("notes.pdf", b"<html>not a pdf</html>")

    assert exc_info.value.status_code == 400


def test_academic_upload_validation_checks_office_container_type():
    archive_bytes = io.BytesIO()
    with zipfile.ZipFile(archive_bytes, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types />")
        archive.writestr("word/document.xml", "<document />")

    assert storage.validate_academic_upload("notes.docx", archive_bytes.getvalue()).endswith("wordprocessingml.document")
    with pytest.raises(HTTPException):
        storage.validate_academic_upload("slides.pptx", archive_bytes.getvalue())


def test_signed_download_uses_short_expiry_and_server_credentials(monkeypatch):
    monkeypatch.setattr(
        storage,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://example.supabase.co",
            supabase_service_role_key="server-only-key",
        ),
    )
    captured = {}

    class Response:
        def __enter__(self):
            return io.BytesIO(json.dumps({"signedURL": "/storage/v1/object/sign/academic/file.pdf?token=short"}).encode())

        def __exit__(self, *_args):
            return False

    def open_request(request, timeout):
        captured["request"] = request
        captured["timeout"] = timeout
        return Response()

    monkeypatch.setattr(storage, "urlopen", open_request)
    url = storage.create_academic_signed_url(
        "academic-resources",
        "level 100/file.pdf",
        expires_in=60,
        download_filename="file.pdf",
    )

    payload = json.loads(captured["request"].data)
    assert payload == {"expiresIn": 60, "download": "file.pdf"}
    assert captured["request"].headers["Authorization"] == "Bearer server-only-key"
    assert url == "https://example.supabase.co/storage/v1/object/sign/academic/file.pdf?token=short"
