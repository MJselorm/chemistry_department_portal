from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import AdminRoleAudit, User
from app.security import get_current_user


class _UserQuery:
    def __init__(self, users):
        self.users = users

    def filter(self, *expressions):
        if expressions:
            values = expressions[0].compile().params.values()
            search_term = next((value.strip("%").lower() for value in values if isinstance(value, str) and "%" in value), None)
            if search_term:
                self.users = [
                    user for user in self.users
                    if search_term in (user.email or "").lower()
                    or search_term in (user.full_name or "").lower()
                ]
        return self

    def order_by(self, *_args):
        return self

    def limit(self, _limit):
        return self

    def all(self):
        return list(self.users)


class _Session:
    def __init__(self, users, admin_count=None):
        self.users = users
        self.admin_count = admin_count
        self.added = []
        self.commits = 0
        self.locked = False

    def execute(self, statement):
        assert str(statement) == "LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE"
        self.locked = True

    def scalar(self, statement):
        if "count(" in str(statement).lower():
            if self.admin_count is not None:
                return self.admin_count
            return sum(user.role == "admin" for user in self.users)
        params = statement.compile().params.values()
        return next((
            user for user in self.users
            if user.id in params or user.firebase_uid in params
        ), None)

    def query(self, model):
        assert model is User
        return _UserQuery(self.users)

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def refresh(self, _item):
        return None


def _user(role, email):
    now = datetime.now(timezone.utc)
    return User(
        id=uuid4(),
        firebase_uid=f"firebase-{email}",
        email=email,
        full_name=email.split("@")[0],
        role=role,
        created_at=now,
        updated_at=now,
    )


def test_admin_can_list_promote_and_revoke_users():
    admin = _user("admin", "admin@example.net")
    student = _user("student", "chemist@example.com")
    session = _Session([admin, student])
    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_db] = lambda: session
    try:
        with TestClient(app) as client:
            listed = client.get("/admin/users?search=chemist")
            promoted = client.patch(
                f"/admin/users/{student.id}/role",
                json={"role": "admin"},
            )
            revoked = client.patch(
                f"/admin/users/{student.id}/role",
                json={"role": "student"},
            )
        assert listed.status_code == 200
        assert len(listed.json()) == 1
        assert listed.json()[0]["email"] == student.email
        assert promoted.status_code == 200
        assert promoted.json()["role"] == "admin"
        assert revoked.status_code == 200
        assert revoked.json()["role"] == "student"
        audit = [item for item in session.added if isinstance(item, AdminRoleAudit)]
        assert [(item.previous_role, item.new_role) for item in audit] == [
            ("student", "admin"),
            ("admin", "student"),
        ]
    finally:
        app.dependency_overrides.clear()


def test_student_cannot_access_admin_management_or_self_promote():
    student = _user("student", "chemist@example.net")
    session = _Session([student])
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: session
    try:
        with TestClient(app) as client:
            users = client.get("/admin/users")
            role_change = client.patch(
                f"/admin/users/{student.id}/role",
                json={"role": "admin"},
            )
            profile_change = client.patch(
                "/users/me",
                json={"full_name": "Updated Name", "role": "admin"},
            )
        assert users.status_code == 403
        assert role_change.status_code == 403
        assert profile_change.status_code == 200
        assert student.role == "student"
        assert session.added == []
    finally:
        app.dependency_overrides.clear()


def test_last_admin_and_self_role_changes_are_rejected():
    from app.users import change_user_role

    admin = _user("admin", "admin@example.org")
    session = _Session([admin])
    try:
        change_user_role(session, admin, admin.id, "student")
    except ValueError as exc:
        assert "own" in str(exc)
    else:
        raise AssertionError("self-demotion should be rejected")

    target_admin = _user("admin", "second-admin@example.org")
    session = _Session([admin, target_admin], admin_count=1)
    try:
        change_user_role(session, admin, target_admin.id, "student")
    except ValueError as exc:
        assert "last administrator" in str(exc)
    else:
        raise AssertionError("demoting the last administrator should be rejected")
    assert session.commits == 0


def test_stale_admin_session_cannot_change_roles_after_demotion():
    claimed_admin = _user("admin", "former-admin@example.net")
    stored_admin = User(
        id=claimed_admin.id,
        firebase_uid=claimed_admin.firebase_uid,
        email=claimed_admin.email,
        role="student",
    )
    target = _user("student", "target@example.net")
    session = _Session([stored_admin, target])
    app.dependency_overrides[get_current_user] = lambda: claimed_admin
    app.dependency_overrides[get_db] = lambda: session
    try:
        with TestClient(app) as client:
            response = client.patch(
                f"/admin/users/{target.id}/role",
                json={"role": "admin"},
            )
        assert response.status_code == 403
        assert target.role == "student"
        assert session.added == []
    finally:
        app.dependency_overrides.clear()
