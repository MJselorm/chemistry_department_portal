from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserProfile
from ..security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/test")
def admin_test(current_user: Annotated[User, Depends(require_admin)]):
    """Temporary endpoint for verifying the database-backed admin role check."""
    return {"message": "Admin authorization verified.", "email": current_user.email}


@router.get("/users", response_model=list[UserProfile])
def list_users(
    _: Annotated[User, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db)],
    search: str | None = Query(None, max_length=100),
    limit: int = Query(100, ge=1, le=200),
):
    query = session.query(User)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(pattern), User.email.ilike(pattern), User.student_id.ilike(pattern)))
    return query.order_by(User.created_at.desc()).limit(limit).all()
