import json
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, status

from .config import get_settings


@lru_cache
def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin once, using a server-only credential."""
    settings = get_settings()
    if firebase_admin._apps:
        return firebase_admin.get_app()
    if settings.firebase_service_account_json:
        credential = credentials.Certificate(json.loads(settings.firebase_service_account_json))
    elif settings.firebase_service_account_path:
        credential = credentials.Certificate(settings.firebase_service_account_path)
    else:
        raise RuntimeError(
            "Configure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."
        )
    return firebase_admin.initialize_app(credential)


def verify_id_token(token: str) -> dict:
    try:
        initialize_firebase()
        return auth.verify_id_token(token, check_revoked=True)
    except (
        auth.InvalidIdTokenError,
        auth.ExpiredIdTokenError,
        auth.RevokedIdTokenError,
        auth.UserDisabledError,
    ) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except Exception as exc:
        # Certificate-fetch and service-account problems are server problems,
        # not an expired browser session.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication verification is temporarily unavailable.",
        ) from exc
