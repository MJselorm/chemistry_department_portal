from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UpdateMyProfile, UserProfile
from ..security import get_current_user
from ..users import update_profile
from ..storage import delete_profile_image, profile_image_chunks, upload_profile_image

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
    user = update_profile(session, current_user.firebase_uid, payload.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found. Call /auth/sync first.")
    return user


@router.get("/me/photo")
def get_my_photo(current_user: Annotated[User, Depends(get_current_user)]):
    if not current_user.profile_photo_path:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile photo not found.")
    return StreamingResponse(
        profile_image_chunks(current_user.profile_photo_path),
        media_type=current_user.profile_photo_mime_type or "application/octet-stream",
        headers={"Cache-Control": "private, max-age=300"},
    )


@router.post("/me/photo", response_model=UserProfile)
async def upload_my_photo(
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db)],
):
    old_path = current_user.profile_photo_path
    new_path, content_type = await upload_profile_image(file, str(current_user.id))
    current_user.profile_photo_path = new_path
    current_user.profile_photo_mime_type = content_type
    session.commit()
    session.refresh(current_user)
    if old_path:
        try:
            delete_profile_image(old_path)
        except HTTPException:
            pass
    return current_user


@router.delete("/me/photo", status_code=status.HTTP_204_NO_CONTENT)
def remove_my_photo(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db)],
):
    old_path = current_user.profile_photo_path
    current_user.profile_photo_path = None
    current_user.profile_photo_mime_type = None
    session.commit()
    if old_path:
        try:
            delete_profile_image(old_path)
        except HTTPException:
            pass
