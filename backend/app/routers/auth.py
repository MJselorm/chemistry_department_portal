from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import UserProfile
from ..security import current_firebase_claims
from ..users import sync_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/sync", response_model=UserProfile)
def sync_authenticated_user(
    claims: Annotated[dict, Depends(current_firebase_claims)],
    session: Annotated[Session, Depends(get_db)],
):
    """Idempotently provision/read the Supabase profile for the Firebase user."""
    try:
        return sync_user(session, claims)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
