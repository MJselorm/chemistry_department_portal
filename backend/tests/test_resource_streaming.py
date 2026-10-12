from app.models import Resource
from app.routers import resources


def test_storage_response_guesses_a_pdf_content_type_for_legacy_records(monkeypatch):
    monkeypatch.setattr(resources, "academic_file_chunks", lambda *_: iter([b"%PDF-"]))
    resource = Resource(
        name="CHEM 151 lecture.pdf",
        folder_path="CHEM 100/SEM 1",
        google_drive_file_id="legacy-resource",
        supabase_bucket="academic",
        supabase_storage_path="CHEM 100/SEM 1/CHEM 151 lecture.pdf",
        mime_type=None,
    )

    response = resources._storage_response(resource, "inline")

    assert response.media_type == "application/pdf"
    assert response.headers["content-type"].startswith("application/pdf")
