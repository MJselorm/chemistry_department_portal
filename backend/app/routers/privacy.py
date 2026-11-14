from typing import Annotated
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PrivacyRequest, User
from ..privacy_schemas import (
    PrivacyRequestAdminOut,
    PrivacyRequestAdminPage,
    PrivacyRequestCreate,
    PrivacyRequestOut,
    PrivacyRequestPage,
    PrivacyRequestReview,
    PrivacyRequestStatus,
    PrivacyRequestType,
)
from ..security import get_current_user, require_admin
from ..services.privacy import (
    ACTIVE_REQUEST_STATUSES,
    audit_privacy_event,
    build_personal_data_export,
    enforce_privacy_rate_limit,
    transition_privacy_request,
)

router = APIRouter(prefix="/privacy", tags=["privacy"])
admin_router = APIRouter(prefix="/admin/privacy", tags=["admin privacy"])
DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin)]


@router.post("/requests", response_model=PrivacyRequestOut, status_code=status.HTTP_201_CREATED)
def create_privacy_request(payload: PrivacyRequestCreate, request: Request, session: DB, user: CurrentUser):
    """Create a manual data export or account-deletion request for its owner."""
    ip_hash = enforce_privacy_rate_limit(session, request, user, "request")
    duplicate = (
        session.query(PrivacyRequest.id)
        .filter(
            PrivacyRequest.user_id == user.id,
            PrivacyRequest.request_type == payload.request_type,
            PrivacyRequest.status.in_(ACTIVE_REQUEST_STATUSES),
        )
        .first()
    )
    if duplicate:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active request of this type.",
        )

    item = PrivacyRequest(
        id=uuid4(),
        user_id=user.id,
        request_type=payload.request_type,
        details=payload.details,
        status="pending",
    )
    session.add(item)
    audit_privacy_event(
        session,
        event_type="privacy_request_created",
        actor_user_id=user.id,
        privacy_request_id=item.id,
        ip_hash=ip_hash,
        detail=payload.request_type,
    )
    try:
        session.commit()
    except IntegrityError as exc:
        # The partial unique index is authoritative for concurrent submissions.
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active request of this type.",
        ) from exc
    session.refresh(item)
    return item


@router.get("/requests", response_model=PrivacyRequestPage)
def list_my_privacy_requests(
    session: DB,
    user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    query = session.query(PrivacyRequest).filter(PrivacyRequest.user_id == user.id)
    total = query.count()
    items = query.order_by(PrivacyRequest.created_at.desc()).offset(offset).limit(limit).all()
    return {"items": items, "limit": limit, "offset": offset, "total": total}


@router.get("/export")
def export_my_personal_data(request: Request, session: DB, user: CurrentUser):
    """Generate a JSON file from the authenticated user's own rows only."""
    ip_hash = enforce_privacy_rate_limit(session, request, user, "export")
    payload = build_personal_data_export(session, user)
    audit_privacy_event(
        session,
        event_type="privacy_export_generated",
        actor_user_id=user.id,
        ip_hash=ip_hash,
        detail="server_generated_json",
    )
    session.commit()
    return JSONResponse(
        content=jsonable_encoder(payload),
        headers={"Content-Disposition": 'attachment; filename="chemistry-hub-personal-data.json"'},
    )


@admin_router.get("/requests", response_model=PrivacyRequestAdminPage)
def list_privacy_requests(
    request: Request,
    session: DB,
    admin: AdminUser,
    request_type: PrivacyRequestType | None = None,
    status_filter: PrivacyRequestStatus | None = Query(default=None, alias="status"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    ip_hash = enforce_privacy_rate_limit(session, request, admin, "admin")
    query = session.query(PrivacyRequest)
    if request_type:
        query = query.filter(PrivacyRequest.request_type == request_type)
    if status_filter:
        query = query.filter(PrivacyRequest.status == status_filter)
    total = query.count()
    items = query.order_by(PrivacyRequest.created_at.desc()).offset(offset).limit(limit).all()
    audit_privacy_event(session, event_type="privacy_requests_listed", actor_user_id=admin.id, ip_hash=ip_hash)
    session.commit()
    return {"items": items, "limit": limit, "offset": offset, "total": total}


@admin_router.get("/requests/{request_id}", response_model=PrivacyRequestAdminOut)
def get_privacy_request(request_id: UUID, request: Request, session: DB, admin: AdminUser):
    ip_hash = enforce_privacy_rate_limit(session, request, admin, "admin")
    item = session.get(PrivacyRequest, request_id)
    if not item:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privacy request not found.")
    audit_privacy_event(
        session,
        event_type="privacy_request_viewed",
        actor_user_id=admin.id,
        privacy_request_id=item.id,
        ip_hash=ip_hash,
    )
    session.commit()
    return item


@admin_router.patch("/requests/{request_id}", response_model=PrivacyRequestAdminOut)
def review_privacy_request(
    request_id: UUID,
    payload: PrivacyRequestReview,
    request: Request,
    session: DB,
    admin: AdminUser,
):
    """Advance a request; approval is recorded only and never deletes an account."""
    ip_hash = enforce_privacy_rate_limit(session, request, admin, "admin")
    item = session.get(PrivacyRequest, request_id)
    if not item:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privacy request not found.")
    transition_privacy_request(item, payload.status, payload.resolution_note, admin)
    audit_privacy_event(
        session,
        event_type="privacy_request_reviewed",
        actor_user_id=admin.id,
        privacy_request_id=item.id,
        ip_hash=ip_hash,
        detail=payload.status,
    )
    session.commit()
    session.refresh(item)
    return item
