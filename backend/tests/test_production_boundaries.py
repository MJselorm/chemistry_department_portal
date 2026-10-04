from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.resource_schemas import ResourceOut
from app.routers.resources import get_resource
from app.schemas import UpdateMyProfile
from app.security import require_admin
from app.storage import _valid_image_signature
from app.main import app


class FakeSession:
    def __init__(self, resource):
        self.resource = resource

    def get(self, _model, _resource_id):
        return self.resource


def resource(**overrides):
    values = {"is_active": True, "is_missing": False, "supabase_storage_path": "course/file.pdf"}
    values.update(overrides)
    return SimpleNamespace(**values)


def test_student_cannot_access_hidden_or_unmigrated_resource_by_id():
    student = SimpleNamespace(role="student")
    for hidden in (resource(is_active=False), resource(is_missing=True), resource(supabase_storage_path=None)):
        with pytest.raises(HTTPException) as exc:
            get_resource(7, FakeSession(hidden), student)
        assert exc.value.status_code == 404


def test_admin_can_access_archived_resource_for_management():
    archived = resource(is_active=False)
    assert get_resource(7, FakeSession(archived), SimpleNamespace(role="admin")) is archived


def test_admin_dependency_rejects_student_role():
    with pytest.raises(HTTPException) as exc:
        require_admin(SimpleNamespace(role="student"))
    assert exc.value.status_code == 403
    admin = SimpleNamespace(role="admin")
    assert require_admin(admin) is admin


def test_resource_response_does_not_expose_storage_credentials_or_paths():
    fields = ResourceOut.model_fields
    assert "supabase_bucket" not in fields
    assert "supabase_storage_path" not in fields
    assert "google_drive_file_id" not in fields
    assert "web_content_link" not in fields


def test_profile_fields_are_allowlisted_and_validated():
    payload = UpdateMyProfile(full_name="  Ama Mensah  ", student_id="CHM/2026/001", level="300")
    assert payload.full_name == "Ama Mensah"
    assert UpdateMyProfile(full_name="Ama Mensah", student_id="", level="").student_id is None
    with pytest.raises(ValidationError):
        UpdateMyProfile(full_name="A", level="500")


def test_image_signature_validation_rejects_mislabeled_content():
    assert _valid_image_signature(b"\x89PNG\r\n\x1a\ncontent", "image/png")
    assert not _valid_image_signature(b"<script>alert(1)</script>", "image/png")


@pytest.mark.parametrize("path", [
    "/users/me",
    "/announcements",
    "/notifications",
    "/api/events",
    "/api/events/health",
    "/api/resources",
    "/api/resources/health",
    "/api/directory/summary",
    "/admin/users",
])
def test_private_api_routes_reject_unauthenticated_requests(path):
    response = TestClient(app).get(path)
    assert response.status_code == 401


def test_system_health_remains_public_and_minimal():
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
