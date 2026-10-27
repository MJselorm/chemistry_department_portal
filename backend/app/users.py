import uuid

from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import EmailStr, TypeAdapter

from .models import AdminRoleAudit, User


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


def change_user_role(
    session: Session,
    actor: User,
    target_id: uuid.UUID,
    new_role: str,
) -> User:
    if target_id == actor.id:
        raise ValueError("You cannot change your own administrator role.")

    # Serialize role changes so concurrent demotions cannot remove every admin.
    session.execute(text("LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE"))
    current_actor = session.scalar(select(User).where(User.id == actor.id).with_for_update())
    if not current_actor or current_actor.role != "admin":
        raise PermissionError("Admin access is required.")
    target = session.scalar(select(User).where(User.id == target_id).with_for_update())
    if not target:
        raise LookupError("User account not found.")
    if target.role == new_role:
        return target

    if target.role == "admin" and new_role == "student":
        admin_count = session.scalar(select(func.count(User.id)).where(User.role == "admin"))
        if admin_count <= 1:
            raise ValueError("The last administrator cannot be demoted.")

    session.add(AdminRoleAudit(
        actor_user_id=current_actor.id,
        target_user_id=target.id,
        previous_role=target.role,
        new_role=new_role,
    ))
    target.role = new_role
    session.commit()
    session.refresh(target)
    return target


def update_profile(session: Session, firebase_uid: str, full_name: str | None) -> User | None:
    user = find_by_firebase_uid(session, firebase_uid)
    if user:
        user.full_name = full_name
        session.commit()
        session.refresh(user)
    return user
