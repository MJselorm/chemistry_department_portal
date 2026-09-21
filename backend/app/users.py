from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import User


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


def update_profile(session: Session, firebase_uid: str, full_name: str | None) -> User | None:
    user = find_by_firebase_uid(session, firebase_uid)
    if user:
        user.full_name = full_name
        session.commit()
        session.refresh(user)
    return user
