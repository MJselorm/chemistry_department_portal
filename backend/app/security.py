from typing import Annotated
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .firebase import verify_id_token
from .models import User
from .users import find_by_firebase_uid

bearer_scheme = HTTPBearer(auto_error=False)


def current_firebase_claims(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_id_token(credentials.credentials)


def get_current_user(
    claims: Annotated[dict, Depends(current_firebase_claims)],
    session: Annotated[Session, Depends(get_db)],
) -> User:
    """Return the database profile for the verified Firebase identity."""
    user = find_by_firebase_uid(session, claims["uid"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Call /auth/sync first.",
        )
    return user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require an authenticated administrator, including Super Admins."""
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required.",
        )
    return current_user


def require_super_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin authorization is required.",
        )
    return current_user


def require_recent_mfa(claims: Annotated[dict, Depends(current_firebase_claims)]) -> dict:
    firebase_claims = claims.get("firebase") or {}
    second_factor = firebase_claims.get("sign_in_second_factor")
    auth_time = claims.get("auth_time")
    now = datetime.now(timezone.utc).timestamp()
    if (
        second_factor not in {"phone", "totp"}
        or not isinstance(auth_time, (int, float))
        or auth_time > now + 30
        or now - auth_time > 300
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Re-authenticate with a second factor within the last five minutes to approve role changes.",
        )
    return claims


def require_super_admin_mfa(
    super_admin: Annotated[User, Depends(require_super_admin)],
    _: Annotated[dict, Depends(require_recent_mfa)],
) -> User:
    return super_admin
