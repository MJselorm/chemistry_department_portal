from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.models import AdminRoleAudit, AdminRoleChangeRequest, User
from app.security import current_firebase_claims, get_current_user, require_recent_mfa


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


class _ScalarResults:
    def __init__(self, values):
        self.values = values

    def unique(self):
        return self

    def all(self):
        return list(self.values)


class _Session:
    def __init__(self, users):
        self.users = users
        self.requests = []
        self.added = []
        self.commits = 0
        self.locks = []

    def execute(self, statement):
        self.locks.append(str(statement))

    def scalar(self, statement):
        entity = statement.column_descriptions[0]["entity"]
        params = statement.compile().params.values()
        if entity is User:
            return next((
                user for user in self.users
                if user.id in params or user.firebase_uid in params
            ), None)
        if entity is AdminRoleChangeRequest:
            return next((
                request for request in self.requests
                if request.id in params
                or request.target_user_id in params and request.status == "pending"
            ), None)
        return None

    def scalars(self, statement):
        params = statement.compile().params.values()
        results = list(self.requests)
        if any(isinstance(value, str) and value == "pending" for value in params):
            results = [request for request in self.requests if request.status == "pending"]
        else:
            results = list(self.requests)
        target_ids = {value for value in params if hasattr(value, "hex")}
        if target_ids:
            results = [request for request in results if request.requester_user_id in target_ids]
        results.sort(key=lambda request: request.requested_at, reverse=True)
        return _ScalarResults(results[:250])

    def query(self, model):
        assert model is User
        return _UserQuery(self.users)

    def add(self, item):
        self.added.append(item)
        if isinstance(item, AdminRoleChangeRequest):
            item.id = item.id or uuid4()
            item.requested_at = item.requested_at or datetime.now(timezone.utc)
            item.requester = next(user for user in self.users if user.id == item.requester_user_id)
            item.target = next(user for user in self.users if user.id == item.target_user_id)
            self.requests.append(item)

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


def _request(requester, target, requested_role):
    request = AdminRoleChangeRequest(
        id=uuid4(),
        requester_user_id=requester.id,
        target_user_id=target.id,
        previous_role=target.role,
        requested_role=requested_role,
        status="pending",
        requested_at=datetime.now(timezone.utc),
        requester=requester,
        target=target,
    )
    return request


def _override(user, session, claims=None):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: session
    if claims is not None:
        app.dependency_overrides[current_firebase_claims] = lambda: claims


def test_admin_can_request_but_cannot_change_or_approve_role():
    admin = _user("admin", "admin@example.net")
    student = _user("student", "chemist@example.com")
    session = _Session([admin, student])
    _override(admin, session, {
        "uid": admin.firebase_uid,
        "auth_time": datetime.now(timezone.utc).timestamp(),
        "firebase": {"sign_in_second_factor": "totp"},
    })
    try:
        with TestClient(app) as client:
            requested = client.post(
                f"/admin/users/{student.id}/role-change-requests",
                json={"role": "admin"},
            )
            self_request = client.post(
                f"/admin/users/{admin.id}/role-change-requests",
                json={"role": "admin"},
            )
            duplicate = client.post(
                f"/admin/users/{student.id}/role-change-requests",
                json={"role": "admin"},
            )
            direct_change = client.patch(
                f"/admin/users/{student.id}/role",
                json={"role": "admin"},
            )
            approval = client.post(f"/admin/role-change-requests/{session.requests[0].id}/approve")
            rejection = client.post(
                f"/admin/role-change-requests/{session.requests[0].id}/reject",
                json={"resolution_note": "Needs review"},
            )

        assert requested.status_code == 201
        assert requested.json()["status"] == "pending"
        assert requested.json()["requester_user_id"] == str(admin.id)
        assert student.role == "student"
        assert self_request.status_code == 409
        assert duplicate.status_code == 409
        assert direct_change.status_code == 404
        assert approval.status_code == 403
        assert rejection.status_code == 403
        assert session.commits == 1
    finally:
        app.dependency_overrides.clear()


def test_student_cannot_list_or_create_role_change_requests():
    student = _user("student", "student@example.net")
    target = _user("student", "other@example.net")
    session = _Session([student, target])
    _override(student, session)
    try:
        with TestClient(app) as client:
            listing = client.get("/admin/role-change-requests")
            creation = client.post(
                f"/admin/users/{target.id}/role-change-requests",
                json={"role": "admin"},
            )
        assert listing.status_code == 403
        assert creation.status_code == 403
        assert target.role == "student"
        assert session.requests == []
    finally:
        app.dependency_overrides.clear()


def test_super_admin_with_recent_mfa_can_approve_and_audit():
    admin = _user("admin", "requester@example.net")
    super_admin = _user("super_admin", "approver@example.net")
    student = _user("student", "target@example.net")
    session = _Session([admin, super_admin, student])
    request = _request(admin, student, "admin")
    session.requests.append(request)
    claims = {
        "uid": super_admin.firebase_uid,
        "auth_time": datetime.now(timezone.utc).timestamp(),
        "firebase": {"sign_in_second_factor": "totp"},
    }
    _override(super_admin, session, claims)
    try:
        with TestClient(app) as client:
            response = client.post(f"/admin/role-change-requests/{request.id}/approve")
        assert response.status_code == 200
        assert response.json()["status"] == "approved"
        assert student.role == "admin"
        assert request.approver_user_id == super_admin.id
        audit = next(item for item in session.added if isinstance(item, AdminRoleAudit))
        assert (audit.actor_user_id, audit.target_user_id) == (super_admin.id, student.id)
        assert audit.request_id == request.id
        assert (audit.previous_role, audit.new_role) == ("student", "admin")
        assert session.locks == [
            "LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE",
            "LOCK TABLE public.admin_role_change_requests IN SHARE ROW EXCLUSIVE MODE",
        ]
    finally:
        app.dependency_overrides.clear()


def test_super_admin_can_reject_and_history_records_outcome():
    admin = _user("admin", "requester@example.net")
    super_admin = _user("super_admin", "approver@example.net")
    student = _user("student", "target@example.net")
    session = _Session([admin, super_admin, student])
    request = _request(admin, student, "admin")
    session.requests.append(request)
    _override(super_admin, session)
    try:
        with TestClient(app) as client:
            response = client.post(
                f"/admin/role-change-requests/{request.id}/reject",
                json={"resolution_note": "Not approved"},
            )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"
        assert response.json()["approver_user_id"] == str(super_admin.id)
        assert response.json()["resolution_note"] == "Not approved"
        assert student.role == "student"
        assert session.commits == 1
    finally:
        app.dependency_overrides.clear()


def test_super_admin_approval_requires_recent_firebase_mfa():
    super_admin = _user("super_admin", "approver@example.net")
    student = _user("student", "target@example.net")
    session = _Session([super_admin, student])
    request = _request(_user("admin", "requester@example.net"), student, "admin")
    session.requests.append(request)
    claims = {
        "uid": super_admin.firebase_uid,
        "auth_time": datetime.now(timezone.utc).timestamp() - 301,
        "firebase": {"sign_in_second_factor": "totp"},
    }
    _override(super_admin, session, claims)
    try:
        with TestClient(app) as client:
            response = client.post(f"/admin/role-change-requests/{request.id}/approve")
        assert response.status_code == 403
        assert "second factor" in response.json()["detail"]
        assert request.status == "pending"
        assert student.role == "student"
    finally:
        app.dependency_overrides.clear()


def test_last_super_admin_cannot_be_demoted_by_role_request():
    from app.users import request_role_change

    requester = _user("admin", "requester@example.net")
    target = _user("super_admin", "last-super@example.net")
    session = _Session([requester, target])
    try:
        request_role_change(session, requester, target.id, "admin")
    except ValueError as exc:
        assert "Super Admin roles cannot be changed" in str(exc)
    else:
        raise AssertionError("Super Admin demotion must not be available through role requests")
    assert session.requests == []


def test_super_admin_cannot_submit_unreviewable_role_request():
    from app.users import request_role_change

    super_admin = _user("super_admin", "super@example.net")
    target = _user("student", "target@example.net")
    session = _Session([super_admin, target])
    try:
        request_role_change(session, super_admin, target.id, "admin")
    except PermissionError as exc:
        assert "regular administrator" in str(exc)
    else:
        raise AssertionError("only regular administrators can submit role requests")
    assert session.requests == []


def test_super_admin_cannot_approve_own_role_request():
    super_admin = _user("super_admin", "super@example.net")
    target = _user("student", "target@example.net")
    session = _Session([super_admin, target])
    request = _request(super_admin, target, "admin")
    session.requests.append(request)
    claims = {
        "uid": super_admin.firebase_uid,
        "auth_time": datetime.now(timezone.utc).timestamp(),
        "firebase": {"sign_in_second_factor": "totp"},
    }
    _override(super_admin, session, claims)
    try:
        with TestClient(app) as client:
            response = client.post(f"/admin/role-change-requests/{request.id}/approve")
        assert response.status_code == 403
        assert request.status == "pending"
        assert target.role == "student"
    finally:
        app.dependency_overrides.clear()


def test_stale_admin_cannot_request_role_change_after_demotion():
    former_admin = _user("admin", "former-admin@example.net")
    stored_student = _user("student", "former-admin@example.net")
    stored_student.id = former_admin.id
    target = _user("student", "target@example.net")
    session = _Session([stored_student, target])
    _override(former_admin, session)
    try:
        with TestClient(app) as client:
            response = client.post(
                f"/admin/users/{target.id}/role-change-requests",
                json={"role": "admin"},
            )
        assert response.status_code == 403
        assert target.role == "student"
        assert session.requests == []
    finally:
        app.dependency_overrides.clear()


def test_recent_mfa_claim_rejects_missing_factor_and_old_authentication():
    from fastapi import HTTPException

    now = datetime.now(timezone.utc).timestamp()
    assert require_recent_mfa({
        "auth_time": now,
        "firebase": {"sign_in_second_factor": "phone"},
    })
    for claims in (
        {"auth_time": now, "firebase": {}},
        {"auth_time": now - 301, "firebase": {"sign_in_second_factor": "phone"}},
        {"auth_time": now + 31, "firebase": {"sign_in_second_factor": "totp"}},
    ):
        try:
            require_recent_mfa(claims)
        except HTTPException as exc:
            assert exc.status_code == 403
        else:
            raise AssertionError("invalid or stale MFA claims must be rejected")
