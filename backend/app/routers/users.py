from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UpdateMyProfile, UserProfile
from ..security import get_current_user
from ..users import update_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def get_me(
    user: Annotated[User, Depends(get_current_user)],
):
    return user


@router.patch("/me", response_model=UserProfile)
def patch_me(
    payload: UpdateMyProfile,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db)],
):
    # Role is deliberately absent from this schema: users cannot self-promote.
    user = update_profile(session, current_user.firebase_uid, payload.full_name)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found. Call /auth/sync first.")
    return user
