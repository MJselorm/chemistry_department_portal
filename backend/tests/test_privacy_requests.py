from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models import NotificationRead, PrivacyAuditEvent, PrivacyRequest, PushSubscription, User
from app.privacy_schemas import PrivacyRequestCreate, PrivacyRequestReview
from app.routers import privacy as routes
from app.services.privacy import build_personal_data_export, transition_privacy_request


def _user(role="student"):
    now = datetime.now(timezone.utc)
    return User(
        id=uuid4(),
        firebase_uid=f"uid-{uuid4()}",
        email="student@example.edu",
        full_name="Student Example",
        role=role,
        created_at=now,
        updated_at=now,
    )


def test_request_schema_rejects_client_supplied_ownership_and_review_fields():
    with pytest.raises(ValidationError):
        PrivacyRequestCreate(request_type="data_export", user_id=str(uuid4()))
    with pytest.raises(ValidationError):
        PrivacyRequestCreate(request_type="account_deletion", status="approved")


def test_unauthenticated_users_cannot_use_privacy_endpoints():
    client = TestClient(app)
    assert client.post("/privacy/requests", json={"request_type": "data_export"}).status_code == 401
    assert client.get("/privacy/requests").status_code == 401
    assert client.get("/privacy/export").status_code == 401
    assert client.get("/admin/privacy/requests").status_code == 401


class _PrivacyQuery:
    def __init__(self, existing=None):
        self.existing = existing

    def filter(self, *_args):
        return self

    def first(self):
        return self.existing


class _CreateSession:
    def __init__(self, existing=None):
        self.existing = existing
        self.added = []
        self.commits = 0

    def query(self, _model):
        return _PrivacyQuery(self.existing)

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def rollback(self):
        return None

    def refresh(self, _item):
        return None


def test_student_request_uses_authenticated_identity_and_is_audited(monkeypatch):
    user = _user()
    session = _CreateSession()
    monkeypatch.setattr(routes, "enforce_privacy_rate_limit", lambda *_args: "ip-hash")

    item = routes.create_privacy_request(
        PrivacyRequestCreate(request_type="data_export", details="Please send JSON."),
        object(),
        session,
        user,
    )

    assert item.user_id == user.id
    assert item.status == "pending"
    assert session.commits == 1
    audit = next(row for row in session.added if isinstance(row, PrivacyAuditEvent))
    assert audit.actor_user_id == user.id
    assert audit.privacy_request_id == item.id


def test_duplicate_active_request_is_rejected(monkeypatch):
    user = _user()
    existing = PrivacyRequest(id=uuid4(), user_id=user.id, request_type="data_export", status="pending")
    monkeypatch.setattr(routes, "enforce_privacy_rate_limit", lambda *_args: "ip-hash")

    with pytest.raises(HTTPException) as error:
        routes.create_privacy_request(PrivacyRequestCreate(request_type="data_export"), object(), _CreateSession(existing), user)

    assert error.value.status_code == 409


def test_only_the_documented_review_transitions_are_allowed():
    admin = _user("admin")
    item = PrivacyRequest(id=uuid4(), user_id=uuid4(), request_type="account_deletion", status="pending")

    with pytest.raises(HTTPException) as error:
        transition_privacy_request(item, "approved", "approved", admin)
    assert error.value.status_code == 409

    transition_privacy_request(item, "under_review", None, admin)
    assert item.status == "under_review"
    assert item.resolved_at is None

    transition_privacy_request(item, "approved", "Identity and retention review completed.", admin)
    assert item.status == "approved"
    assert item.resolved_by == admin.id
    assert item.resolved_at is not None
    # Approval records the decision only; it performs no deletion operation.
    assert item.user_id is not None


class _ExportQuery:
    def __init__(self, rows, expected_owner_column):
        self.rows = rows
        self.expected_owner_column = expected_owner_column

    def filter(self, *args):
        assert any(self.expected_owner_column in str(argument) for argument in args)
        return self

    def order_by(self, *_args):
        return self

    def limit(self, _limit):
        return self

    def all(self):
        return self.rows


class _ExportSession:
    def __init__(self, request_rows, read_rows, subscription_rows):
        self.rows = {
            PrivacyRequest: (request_rows, "privacy_requests.user_id"),
            NotificationRead: (read_rows, "notification_reads.user_id"),
            PushSubscription: (subscription_rows, "push_subscriptions.user_id"),
        }

    def query(self, model):
        rows, owner_column = self.rows[model]
        return _ExportQuery(rows, owner_column)


def test_export_contains_only_safe_personal_metadata(monkeypatch):
    user = _user()
    now = datetime.now(timezone.utc)
    request = PrivacyRequest(id=uuid4(), user_id=user.id, request_type="data_export", status="approved", details="My request", created_at=now, updated_at=now)
    read = NotificationRead(notification_id=uuid4(), user_id=user.id, read_at=now, dismissed_at=None)
    subscription = PushSubscription(id=uuid4(), user_id=user.id, endpoint="https://secret.example", p256dh="secret-key", auth="secret-auth", created_at=now, updated_at=now)
    monkeypatch.setattr(routes, "enforce_privacy_rate_limit", lambda *_args: "ip-hash")

    exported = build_personal_data_export(_ExportSession([request], [read], [subscription]), user)

    assert exported["account"]["id"] == str(user.id)
    assert exported["push_subscription_metadata"][0]["id"] == str(subscription.id)
    assert "endpoint" not in exported["push_subscription_metadata"][0]
    assert "p256dh" not in exported["push_subscription_metadata"][0]
    assert "auth" not in exported["push_subscription_metadata"][0]
    assert "shared academic resources" in exported["omissions"][1].lower()


def test_review_schema_rejects_spoofed_administrator_fields():
    with pytest.raises(ValidationError):
        PrivacyRequestReview(status="under_review", resolved_by=str(uuid4()))
