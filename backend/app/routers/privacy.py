from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import NotificationRead, PrivacyRequest, PushSubscription, User
from ..privacy_schemas import (
    AccountDeletionRequest,
    AdminPrivacyRequestOut,
    DataExportResponse,
    PrivacyRequestOut,
    PrivacyRequestStatus,
    PrivacyRequestUpdate,
)
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/api/privacy", tags=["privacy"])
DB = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
Admin = Annotated[User, Depends(require_admin)]


def _new_request(user: User, request_type: str, *, reason: str | None = None, status_value: str = "pending") -> PrivacyRequest:
    return PrivacyRequest(
        user_id=user.id,
        requester_email=user.email,
        requester_name=user.full_name,
        request_type=request_type,
        status=status_value,
        reason=reason,
    )


@router.get("/requests/me", response_model=list[PrivacyRequestOut])
def my_privacy_requests(session: DB, user: CurrentUser):
    return (
        session.query(PrivacyRequest)
        .filter(PrivacyRequest.user_id == user.id)
        .order_by(PrivacyRequest.created_at.desc())
        .limit(100)
        .all()
    )


@router.post("/requests/export", response_model=DataExportResponse, status_code=status.HTTP_201_CREATED)
def export_my_data(session: DB, user: CurrentUser):
    export_request = _new_request(user, "data_export")
    now = datetime.now(timezone.utc)
    session.add(export_request)
    session.flush()

    reads = session.query(NotificationRead).filter(NotificationRead.user_id == user.id).all()
    subscriptions = session.query(PushSubscription).filter(PushSubscription.user_id == user.id).all()
    requests = (
        session.query(PrivacyRequest)
        .filter(PrivacyRequest.user_id == user.id)
        .order_by(PrivacyRequest.created_at.desc())
        .limit(100)
        .all()
    )
    export_request.status = "completed"
    export_request.resolved_at = now
    session.commit()
    session.refresh(export_request)
    return {
        "generated_at": now,
        "request": export_request,
        "account": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        },
        "notification_read_state": [
            {"notification_id": str(item.notification_id), "read_at": item.read_at, "dismissed_at": item.dismissed_at}
            for item in reads
        ],
        "push_subscriptions": [
            {
                "id": str(item.id),
                "is_active": item.is_active,
                "user_agent": item.user_agent,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in subscriptions
        ],
        "privacy_requests": requests,
    }


@router.post("/requests/deletion", response_model=PrivacyRequestOut)
def request_account_deletion(payload: AccountDeletionRequest, session: DB, user: CurrentUser):
    existing = (
        session.query(PrivacyRequest)
        .filter(
            PrivacyRequest.user_id == user.id,
            PrivacyRequest.request_type == "account_deletion",
            PrivacyRequest.status.in_(("pending", "in_review")),
        )
        .order_by(PrivacyRequest.created_at.desc())
        .first()
    )
    if existing:
        return existing

    privacy_request = _new_request(user, "account_deletion", reason=payload.reason)
    session.add(privacy_request)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        existing = (
            session.query(PrivacyRequest)
            .filter(
                PrivacyRequest.user_id == user.id,
                PrivacyRequest.request_type == "account_deletion",
                PrivacyRequest.status.in_(("pending", "in_review")),
            )
            .first()
        )
        if existing:
            return existing
        raise
    session.refresh(privacy_request)
    return privacy_request


@router.get("/admin/requests", response_model=list[AdminPrivacyRequestOut])
def admin_privacy_requests(
    session: DB,
    _: Admin,
    request_status: PrivacyRequestStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=250),
):
    query = session.query(PrivacyRequest)
    if request_status:
        query = query.filter(PrivacyRequest.status == request_status)
    return query.order_by(PrivacyRequest.created_at.desc()).limit(limit).all()


@router.patch("/admin/requests/{request_id}", response_model=AdminPrivacyRequestOut)
def update_privacy_request(request_id: UUID, payload: PrivacyRequestUpdate, session: DB, admin: Admin):
    privacy_request = session.get(PrivacyRequest, request_id)
    if not privacy_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Privacy request not found.")
    if payload.status in {"completed", "rejected"} and not payload.resolution_note:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A resolution note is required.")

    privacy_request.status = payload.status
    privacy_request.resolution_note = payload.resolution_note
    if payload.status in {"completed", "rejected", "cancelled"}:
        privacy_request.resolved_at = datetime.now(timezone.utc)
        privacy_request.resolved_by_id = admin.id
    else:
        privacy_request.resolved_at = None
        privacy_request.resolved_by_id = None
    session.commit()
    session.refresh(privacy_request)
    return privacy_request
