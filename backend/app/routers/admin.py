from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..rate_limit import ROLE_DECISION_LIMIT, ROLE_REQUEST_LIMIT
from ..schemas import AdminRoleChangeReject, AdminRoleChangeRequestCreate, AdminRoleChangeRequestOut, UserProfile
from ..security import require_admin, require_super_admin, require_super_admin_mfa
from ..users import approve_role_change, list_role_change_requests, reject_role_change, request_role_change

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


@router.post(
    "/users/{user_id}/role-change-requests",
    response_model=AdminRoleChangeRequestOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(ROLE_REQUEST_LIMIT)],
)
def create_role_change_request(
    user_id: UUID,
    payload: AdminRoleChangeRequestCreate,
    current_user: Annotated[User, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db)],
):
    try:
        return request_role_change(session, current_user, user_id, payload.role)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/role-change-requests", response_model=list[AdminRoleChangeRequestOut])
def get_role_change_requests(
    current_user: Annotated[User, Depends(require_admin)],
    session: Annotated[Session, Depends(get_db)],
    request_status: str | None = Query(default=None, alias="status", pattern="^(pending|approved|rejected)$"),
    limit: int = Query(default=100, ge=1, le=250),
):
    return list_role_change_requests(session, current_user, request_status, limit)


@router.post(
    "/role-change-requests/{request_id}/approve",
    response_model=AdminRoleChangeRequestOut,
    dependencies=[Depends(ROLE_DECISION_LIMIT)],
)
def approve_admin_role_change(
    request_id: UUID,
    current_user: Annotated[User, Depends(require_super_admin_mfa)],
    session: Annotated[Session, Depends(get_db)],
):
    try:
        return approve_role_change(session, current_user, request_id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.post(
    "/role-change-requests/{request_id}/reject",
    response_model=AdminRoleChangeRequestOut,
    dependencies=[Depends(ROLE_DECISION_LIMIT)],
)
def reject_admin_role_change(
    request_id: UUID,
    payload: AdminRoleChangeReject,
    current_user: Annotated[User, Depends(require_super_admin)],
    session: Annotated[Session, Depends(get_db)],
):
    try:
        return reject_role_change(session, current_user, request_id, payload.resolution_note)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
