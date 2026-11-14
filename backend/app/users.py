import uuid
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import EmailStr, TypeAdapter

from .models import AdminRoleAudit, AdminRoleChangeRequest, User


def find_by_firebase_uid(session: Session, firebase_uid: str) -> User | None:
    return session.scalar(select(User).where(User.firebase_uid == firebase_uid))


def sync_user(session: Session, claims: dict) -> User:
    """Create the app profile once. All identity values come from verified claims."""
    firebase_uid = claims["uid"]
    existing = find_by_firebase_uid(session, firebase_uid)
    if existing:
        return existing

    email = claims.get("email")
    if not email:
        raise ValueError("A Firebase email address is required.")
    try:
        email = TypeAdapter(EmailStr).validate_python(email)
    except ValueError as exc:
        raise ValueError("A valid email address is required.") from exc
    if claims.get("email_verified") is not True:
        raise PermissionError("Verify your email address before creating a Chemistry Hub account.")
    user = User(firebase_uid=firebase_uid, email=email, full_name=claims.get("name"))
    try:
        with session.begin_nested():
            session.add(user)
            session.flush()
        session.commit()
        session.refresh(user)
        return user
    except IntegrityError:
        # The unique constraint makes simultaneous /auth/sync calls idempotent.
        session.rollback()
        existing = find_by_firebase_uid(session, firebase_uid)
        if existing:
            return existing
        raise


def request_role_change(
    session: Session,
    requester: User,
    target_id: uuid.UUID,
    requested_role: str,
) -> AdminRoleChangeRequest:
    if target_id == requester.id:
        raise ValueError("You cannot request a change to your own role.")
    if requested_role not in {"admin", "student"}:
        raise ValueError("Only administrator or student roles can be requested.")

    # Serialize request creation and approvals so role snapshots cannot race.
    session.execute(text("LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE"))
    session.execute(text("LOCK TABLE public.admin_role_change_requests IN SHARE ROW EXCLUSIVE MODE"))
    current_requester = session.scalar(
        select(User).where(User.id == requester.id).with_for_update()
    )
    if not current_requester or current_requester.role != "admin":
        raise PermissionError("Only a regular administrator can request a role change.")
    target = session.scalar(select(User).where(User.id == target_id).with_for_update())
    if not target:
        raise LookupError("User account not found.")
    if target.role == "super_admin":
        raise ValueError("Super Admin roles cannot be changed through administrator requests.")
    if target.role == requested_role:
        raise ValueError("The user already has the requested role.")
    pending = session.scalar(
        select(AdminRoleChangeRequest.id).where(
            AdminRoleChangeRequest.target_user_id == target.id,
            AdminRoleChangeRequest.status == "pending",
        )
    )
    if pending:
        raise ValueError("A role-change request for this user is already pending.")

    request = AdminRoleChangeRequest(
        requester_user_id=current_requester.id,
        target_user_id=target.id,
        previous_role=target.role,
        requested_role=requested_role,
        status="pending",
    )
    session.add(request)
    session.commit()
    session.refresh(request)
    return request


def list_role_change_requests(
    session: Session,
    viewer: User,
    request_status: str | None,
    limit: int,
) -> list[AdminRoleChangeRequest]:
    query = select(AdminRoleChangeRequest)
    if viewer.role != "super_admin":
        query = query.where(AdminRoleChangeRequest.requester_user_id == viewer.id)
    if request_status:
        query = query.where(AdminRoleChangeRequest.status == request_status)
    return list(
        session.scalars(
            query.order_by(AdminRoleChangeRequest.requested_at.desc()).limit(limit)
        ).unique().all()
    )


def _lock_role_change(
    session: Session,
    approver: User,
    request_id: uuid.UUID,
) -> tuple[User, AdminRoleChangeRequest]:
    session.execute(text("LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE"))
    session.execute(text("LOCK TABLE public.admin_role_change_requests IN SHARE ROW EXCLUSIVE MODE"))
    current_approver = session.scalar(
        select(User).where(User.id == approver.id).with_for_update()
    )
    if not current_approver or current_approver.role != "super_admin":
        raise PermissionError("Super Admin authorization is required.")
    request = session.scalar(
        select(AdminRoleChangeRequest)
        .where(AdminRoleChangeRequest.id == request_id)
        .with_for_update()
    )
    if not request:
        raise LookupError("Role-change request not found.")
    if request.requester_user_id == current_approver.id:
        raise PermissionError("You cannot review your own role-change request.")
    if request.status != "pending":
        raise ValueError("This role-change request has already been resolved.")
    return current_approver, request


def approve_role_change(
    session: Session,
    approver: User,
    request_id: uuid.UUID,
) -> AdminRoleChangeRequest:
    current_approver, request = _lock_role_change(session, approver, request_id)
    target = session.scalar(
        select(User).where(User.id == request.target_user_id).with_for_update()
    )
    if not target:
        raise LookupError("User account not found.")
    if target.role != request.previous_role or target.role == "super_admin":
        request.status = "rejected"
        request.approver_user_id = current_approver.id
        request.resolution_note = "The user's role changed before this request was approved."
        request.resolved_at = datetime.now(timezone.utc)
        session.commit()
        raise ValueError("The user's role changed after this request was submitted. The request was closed.")

    session.add(AdminRoleAudit(
        actor_user_id=current_approver.id,
        target_user_id=target.id,
        request_id=request.id,
        previous_role=target.role,
        new_role=request.requested_role,
    ))
    target.role = request.requested_role
    request.approver_user_id = current_approver.id
    request.status = "approved"
    request.resolved_at = datetime.now(timezone.utc)
    request.resolution_note = None
    session.commit()
    session.refresh(request)
    return request


def reject_role_change(
    session: Session,
    approver: User,
    request_id: uuid.UUID,
    resolution_note: str | None,
) -> AdminRoleChangeRequest:
    current_approver, request = _lock_role_change(session, approver, request_id)
    request.approver_user_id = current_approver.id
    request.status = "rejected"
    request.resolution_note = resolution_note
    request.resolved_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(request)
    return request


def update_profile(session: Session, firebase_uid: str, full_name: str | None) -> User | None:
    user = find_by_firebase_uid(session, firebase_uid)
    if user:
        user.full_name = full_name
        session.commit()
        session.refresh(user)
    return user
