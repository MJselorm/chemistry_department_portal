import os
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://user:pass@localhost/test")
os.environ.setdefault("APP_ENV", "test")

from app.directory_schemas import ContactCreate  # noqa: E402
from app.main import app  # noqa: E402
from app.routers.directory import visible_one  # noqa: E402
from app.security import enforce_account_policy  # noqa: E402
from app.security import require_admin  # noqa: E402
from app.schemas import UpdateMyProfile  # noqa: E402
from app.storage import _detected_image_type  # noqa: E402


client = TestClient(app)


@pytest.mark.parametrize(
    "path",
    [
        "/announcements",
        "/api/directory/summary",
        "/api/directory/search?q=chemistry",
        "/admin/test",
    ],
)
def test_sensitive_reads_reject_anonymous_requests(path):
    response = client.get(path)

    assert response.status_code == 401
    assert response.headers["cache-control"] == "no-store"


def test_cors_does_not_trust_arbitrary_shared_hosting_origin():
    response = client.options(
        "/users/me",
        headers={
            "Origin": "https://attacker.vercel.app",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert response.headers.get("access-control-allow-origin") is None


def test_cors_allows_configured_development_origin():
    response = client.options(
        "/users/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_profile_schema_rejects_privilege_fields():
    with pytest.raises(ValidationError):
        UpdateMyProfile.model_validate({"full_name": "Student", "role": "admin"})


def test_profile_schema_rejects_oversized_name():
    with pytest.raises(ValidationError):
        UpdateMyProfile.model_validate({"full_name": "A" * 201})


def test_admin_dependency_rejects_student_role():
    student = type("User", (), {"role": "student"})()

    with pytest.raises(HTTPException) as exc_info:
        require_admin(student)

    assert exc_info.value.status_code == 403


def test_production_account_policy_fails_closed_when_unconfigured(monkeypatch):
    settings = SimpleNamespace(
        app_env="production",
        permitted_email_domains=set(),
        permitted_user_emails=set(),
        require_verified_email=True,
    )
    monkeypatch.setattr("app.security.get_settings", lambda: settings)

    with pytest.raises(HTTPException) as exc_info:
        enforce_account_policy({"email": "student@example.edu", "email_verified": True})

    assert exc_info.value.status_code == 503


def test_account_policy_rejects_unapproved_domain(monkeypatch):
    settings = SimpleNamespace(
        app_env="production",
        permitted_email_domains={"university.example"},
        permitted_user_emails={"approved.external@example.net"},
        require_verified_email=True,
    )
    monkeypatch.setattr("app.security.get_settings", lambda: settings)

    with pytest.raises(HTTPException) as exc_info:
        enforce_account_policy({"email": "attacker@example.net", "email_verified": True})

    assert exc_info.value.status_code == 403


def test_directory_schema_rejects_unsafe_urls():
    with pytest.raises(ValidationError):
        ContactCreate.model_validate({"name": "Stores", "website": "javascript:alert(1)"})


def test_inactive_directory_record_is_hidden_from_students():
    record = type("Record", (), {"is_active": False})()
    session = type("Session", (), {"get": lambda self, model, ident: record})()
    student = type("User", (), {"role": "student"})()

    with pytest.raises(HTTPException) as exc_info:
        visible_one(session, object, 1, student)

    assert exc_info.value.status_code == 404


@pytest.mark.parametrize(
    ("contents", "expected"),
    [
        (b"\xff\xd8\xff\xe0jpeg", "image/jpeg"),
        (b"\x89PNG\r\n\x1a\nrest", "image/png"),
        (b"RIFF\x00\x00\x00\x00WEBPrest", "image/webp"),
        (b"<svg onload=alert(1)>", None),
        (b"not an image", None),
    ],
)
def test_image_type_detection_uses_file_signature(contents, expected):
    assert _detected_image_type(contents) == expected
