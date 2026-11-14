from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import NotificationRead, PrivacyRequest, PushSubscription, User
from app.privacy_schemas import AccountDeletionRequest
from app.routers.privacy import export_my_data, request_account_deletion
from app.security import get_current_user


class _Query:
    def __init__(self, values):
        self.values = values

    def filter(self, *_args): return self
    def order_by(self, *_args): return self
    def limit(self, limit):
        self.values = self.values[:limit]
        return self
    def all(self): return list(self.values)
    def first(self): return self.values[0] if self.values else None


class _Session:
    def __init__(self, reads=None, subscriptions=None, requests=None):
        self.reads = reads or []
        self.subscriptions = subscriptions or []
        self.requests = requests or []
        self.added = []

    def query(self, model):
        values = {
            NotificationRead: self.reads,
            PushSubscription: self.subscriptions,
            PrivacyRequest: self.requests,
        }[model]
        return _Query(values)

    def add(self, item):
        self.added.append(item)
        if isinstance(item, PrivacyRequest): self.requests.append(item)

    def commit(self): return None
    def flush(self):
        for item in self.added:
            if isinstance(item, PrivacyRequest) and item.id is None: item.id = uuid4()

    def refresh(self, item):
        now = datetime.now(timezone.utc)
        item.id = item.id or uuid4()
        item.created_at = item.created_at or now
        item.updated_at = item.updated_at or now


def _user():
    now = datetime.now(timezone.utc)
    return User(id=uuid4(), firebase_uid="verified-user", email="student@example.edu", full_name="Test Student", role="student", created_at=now, updated_at=now)


def test_deletion_request_uses_authenticated_user_identity():
    user = _user()
    session = _Session()

    result = request_account_deletion(AccountDeletionRequest(reason="No longer needed"), session, user)

    assert result.user_id == user.id
    assert result.requester_email == user.email
    assert result.request_type == "account_deletion"
    assert result.status == "pending"
    assert session.added == [result]


def test_data_export_excludes_push_secrets_and_other_users():
    user = _user()
    read = NotificationRead(notification_id=uuid4(), user_id=user.id)
    subscription = PushSubscription(
        id=uuid4(), user_id=user.id, endpoint="https://push.example/secret",
        p256dh="private-key-material", auth="private-auth-material", user_agent="Test browser",
        is_active=True, created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )
    session = _Session(reads=[read], subscriptions=[subscription])

    exported = export_my_data(session, user)

    assert exported["account"]["email"] == user.email
    assert exported["request"].request_type == "data_export"
    assert exported["request"].status == "completed"
    exported_subscription = exported["push_subscriptions"][0]
    assert "endpoint" not in exported_subscription
    assert "p256dh" not in exported_subscription
    assert "auth" not in exported_subscription


def test_privacy_routes_are_authenticated_and_admin_route_rejects_student():
    user = _user()
    session = _Session()
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: session
    try:
        with TestClient(app) as client:
            deletion = client.post("/api/privacy/requests/deletion", json={"reason": "Please remove my account"})
            admin_list = client.get("/api/privacy/admin/requests")
        assert deletion.status_code == 200
        assert deletion.json()["request_type"] == "account_deletion"
        assert admin_list.status_code == 403
    finally:
        app.dependency_overrides.clear()
