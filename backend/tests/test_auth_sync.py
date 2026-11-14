from contextlib import nullcontext
from uuid import uuid4

import pytest

from app.models import User
from app.users import sync_user


class _Session:
    def __init__(self, existing=None):
        self.users = [existing] if existing else []
        self.added = []

    def scalar(self, _statement):
        return self.users[0] if self.users else None

    def begin_nested(self):
        return nullcontext()

    def add(self, user):
        self.added.append(user)
        self.users.append(user)

    def flush(self):
        for user in self.added:
            user.id = user.id or uuid4()
            user.role = user.role or "student"

    def commit(self):
        return None

    def refresh(self, _user):
        return None

    def rollback(self):
        return None


def test_sync_accepts_verified_email_from_any_domain():
    session = _Session()
    user = sync_user(session, {
        "uid": "non-institutional-user",
        "email": "chemist@example.net",
        "email_verified": True,
        "name": "Chemist Example",
    })

    assert user.email == "chemist@example.net"
    assert user.role == "student"


def test_sync_requires_verification_for_new_email_accounts():
    session = _Session()

    with pytest.raises(PermissionError, match="Verify your email"):
        sync_user(session, {
            "uid": "unverified-user",
            "email": "chemist@example.net",
            "email_verified": False,
        })

    assert session.added == []


def test_sync_rejects_malformed_email_claims():
    with pytest.raises(ValueError, match="valid email address"):
        sync_user(_Session(), {
            "uid": "invalid-email-user",
            "email": "not-an-email",
            "email_verified": True,
        })


def test_existing_profile_remains_available_to_existing_accounts():
    existing = User(
        id=uuid4(),
        firebase_uid="legacy-user",
        email="legacy@knust.edu.gh",
        role="student",
    )
    session = _Session(existing)

    assert sync_user(session, {
        "uid": "legacy-user",
        "email": "legacy@knust.edu.gh",
        "email_verified": False,
    }) is existing
