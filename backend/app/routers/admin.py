from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import AdminRoleUpdate, UserProfile
from ..security import require_admin
from ..users import change_user_role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/test")
def admin_test(current_user: Annotated[User, Depends(require_admin)]):
    """Temporary endpoint for verifying the database-backed admin role check."""
    return {"message": "Admin authorization verified.", "email": current_user.email}


@router.get("/users", response_model=list[UserProfile])
def list_users(
    _: Annotated[User, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db)],
    limit: int = Query(100, ge=1, le=250),
    search: str | None = Query(default=None, max_length=100),
):
    query = session.query(User)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter((User.email.ilike(term)) | (User.full_name.ilike(term)))
    return query.order_by(User.created_at.desc()).limit(limit).all()


@router.patch("/users/{user_id}/role", response_model=UserProfile)
def update_user_role(
    user_id: UUID,
    payload: AdminRoleUpdate,
    current_user: Annotated[User, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db)],
):
    try:
        return change_user_role(session, current_user, user_id, payload.role)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
