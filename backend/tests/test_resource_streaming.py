import pytest
from fastapi import HTTPException

from app.models import Resource
from app.routers import resources


def test_storage_response_guesses_a_pdf_content_type_for_legacy_records(monkeypatch):
    monkeypatch.setattr(resources, "academic_file_chunks", lambda *_: iter([b"%PDF-"]))
    resource = Resource(
        name="CHEM 151 lecture.pdf",
        file_name="CHEM 151 lecture.pdf",
        folder_path="CHEM 100/SEM 1",
        supabase_bucket="academic",
        supabase_storage_path="CHEM 100/SEM 1/CHEM 151 lecture.pdf",
        mime_type=None,
    )

    response = resources._storage_response(resource, "inline")

    assert response.media_type == "application/pdf"
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.headers["cache-control"] == "private, no-store"


def test_storage_response_prefers_a_pdf_extension_over_stale_metadata(monkeypatch):
    monkeypatch.setattr(resources, "academic_file_chunks", lambda *_: iter([b"%PDF-"]))
    resource = Resource(
        name="CHEM 151 lecture.pdf",
        file_name="CHEM 151 lecture.pdf",
        folder_path="CHEM 100/SEM 1",
        supabase_bucket="academic",
        supabase_storage_path="CHEM 100/SEM 1/CHEM 151 lecture.pdf",
        mime_type="application/x-legacy-document",
    )

    response = resources._storage_response(resource, "inline")

    assert response.media_type == "application/pdf"


def test_storage_response_rejects_a_resource_without_a_storage_location():
    resource = Resource(name="missing.pdf", folder_path="CHEM 100/SEM 1")

    with pytest.raises(HTTPException) as exc_info:
        resources._storage_response(resource, "inline")

    assert exc_info.value.status_code == 404


@pytest.mark.parametrize(
    ("filename", "mime_type"),
    [
        ("CHEM 101 handout.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("CHEM 101 slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        ("molecule.png", "image/png"),
    ],
)
def test_storage_response_preserves_supported_download_content_types(monkeypatch, filename, mime_type):
    monkeypatch.setattr(resources, "academic_file_chunks", lambda *_: iter([b"file-bytes"]))
    resource = Resource(
        name=filename,
        file_name=filename,
        folder_path="level-100/semester-1/CHEM101",
        supabase_bucket="academic-resources",
        supabase_storage_path=f"level-100/semester-1/CHEM101/{filename}",
        mime_type=mime_type,
    )

    response = resources._storage_response(resource, "attachment")

    assert response.media_type == mime_type
    assert response.headers["content-disposition"].startswith("attachment;")
