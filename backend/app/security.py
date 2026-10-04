from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .firebase import verify_id_token
from .config import get_settings
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
    claims = verify_id_token(credentials.credentials)
    settings = get_settings()
    email = str(claims.get("email") or "").strip().lower()

    if settings.require_verified_email and not claims.get("email_verified"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "A verified email address is required.")

    allowed_domains = settings.allowed_domains
    allowed_emails = settings.allowed_emails
    if settings.is_production and not allowed_domains and not allowed_emails:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Account access policy is not configured.")
    domain = email.rsplit("@", 1)[-1] if "@" in email else ""
    if (allowed_domains or allowed_emails) and email not in allowed_emails and domain not in allowed_domains:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is not authorized for the portal.")
    return claims


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
    """Require an authenticated user whose database role is admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required.",
        )
    return current_user
