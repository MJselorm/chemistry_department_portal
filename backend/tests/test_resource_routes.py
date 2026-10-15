from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import Resource, User
from app.routers import resources
from app.security import get_current_user


class ResourceSession:
    def __init__(self, resource):
        self.resource = resource

    def get(self, _model, _resource_id):
        return self.resource


def test_resource_stream_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/resources/1/view")

    assert response.status_code == 401


def test_authenticated_student_can_stream_a_storage_resource(monkeypatch):
    resource = Resource(
        id=1,
        name="CHEM 101 notes.pdf",
        file_name="CHEM 101 notes.pdf",
        folder_path="level-100/semester-1/CHEM101",
        mime_type="application/pdf",
        file_size=4,
        supabase_bucket="academic-resources",
        supabase_storage_path="level-100/semester-1/CHEM101/notes.pdf",
        is_active=True,
        download_available=True,
    )
    student = User(firebase_uid="student-1", email="student@example.edu", role="student")
    monkeypatch.setattr(resources, "academic_file_chunks", lambda *_: iter([b"%PDF"]))
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: ResourceSession(resource)
    try:
        with TestClient(app) as client:
            response = client.get("/api/resources/1/view")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.content == b"%PDF"
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.headers["cache-control"] == "private, no-store"
    assert response.headers["content-disposition"].startswith("inline;")
    assert "CHEM%20101%20notes.pdf" in response.headers["content-disposition"]


def test_authenticated_student_gets_short_lived_download_link(monkeypatch):
    resource = Resource(
        id=1,
        name="CHEM 101 notes.pdf",
        file_name="CHEM 101 notes.pdf",
        folder_path="level-100/semester-1/CHEM101",
        supabase_bucket="academic-resources",
        supabase_storage_path="level-100/semester-1/CHEM101/notes.pdf",
        is_active=True,
        download_available=True,
    )
    student = User(firebase_uid="student-1", email="student@example.edu", role="student")
    captured = {}

    def signed_url(bucket, path, **options):
        captured.update(bucket=bucket, path=path, **options)
        return "https://example.supabase.co/signed-file"

    monkeypatch.setattr(resources, "create_academic_signed_url", signed_url)
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: ResourceSession(resource)
    try:
        with TestClient(app) as client:
            response = client.get("/api/resources/1/download-link")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"
    assert response.json() == {"url": "https://example.supabase.co/signed-file", "expires_in": 60}
    assert captured == {
        "bucket": "academic-resources",
        "path": "level-100/semester-1/CHEM101/notes.pdf",
        "expires_in": 60,
        "download_filename": "CHEM 101 notes.pdf",
    }


def test_authenticated_student_gets_private_preview_link(monkeypatch):
    resource = Resource(
        id=1,
        name="CHEM 101 notes.pdf",
        folder_path="level-100/semester-1/CHEM101",
        supabase_bucket="academic-resources",
        supabase_storage_path="level-100/semester-1/CHEM101/notes.pdf",
        is_active=True,
        download_available=True,
    )
    student = User(firebase_uid="student-1", email="student@example.edu", role="student")
    captured = {}

    def signed_url(bucket, path, **options):
        captured.update(bucket=bucket, path=path, **options)
        return "https://example.supabase.co/preview"

    monkeypatch.setattr(resources, "create_academic_signed_url", signed_url)
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: ResourceSession(resource)
    try:
        with TestClient(app) as client:
            response = client.get("/api/resources/1/preview-link")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"
    assert response.json() == {"url": "https://example.supabase.co/preview", "expires_in": 300}
    assert captured == {
        "bucket": "academic-resources",
        "path": "level-100/semester-1/CHEM101/notes.pdf",
        "expires_in": 300,
    }
