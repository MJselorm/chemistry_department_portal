"""Server-side privacy workflow helpers.

All database operations in this module run through FastAPI's trusted database
connection. Browser Supabase roles are intentionally denied direct access to
the privacy tables.
"""

from datetime import datetime, timezone
import hashlib
import hmac
from uuid import UUID, uuid4

from fastapi import HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import NotificationRead, PrivacyAuditEvent, PrivacyRateLimit, PrivacyRequest, PushSubscription, User

ACTIVE_REQUEST_STATUSES = {"pending", "under_review"}
VALID_TRANSITIONS = {
    "pending": {"under_review"},
    "under_review": {"approved", "rejected"},
    "approved": set(),
    "rejected": set(),
}


def client_ip_hash(request: Request) -> str:
    """Pseudonymize the peer address; do not retain a raw IP address."""
    peer = (request.client.host if request.client else "unknown")[:200]
    salt = get_settings().privacy_rate_limit_salt.encode("utf-8")
    return hmac.new(salt, peer.encode("utf-8"), hashlib.sha256).hexdigest()


def _window_start(now: datetime, seconds: int) -> datetime:
    return datetime.fromtimestamp(int(now.timestamp() // seconds) * seconds, tz=timezone.utc)


def _consume_rate_limit(session: Session, *, scope: str, action: str, limit: int) -> None:
    """Atomically consume one Postgres-backed fixed-window allowance."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    window_started_at = _window_start(now, settings.privacy_rate_limit_window_seconds)
    table = PrivacyRateLimit.__table__
    statement = (
        pg_insert(table)
        .values(
            id=uuid4(),
            scope=scope,
            action=action,
            window_started_at=window_started_at,
            count=1,
        )
        .on_conflict_do_update(
            constraint="uq_privacy_rate_limit_window",
            set_={"count": table.c.count + 1, "updated_at": func.now()},
            where=table.c.count < limit,
        )
        .returning(table.c.count)
    )
    allowed = session.execute(statement).scalar_one_or_none()
    if allowed is None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many privacy requests. Please try again later.",
            headers={"Retry-After": str(settings.privacy_rate_limit_window_seconds)},
        )


def enforce_privacy_rate_limit(session: Session, request: Request, user: User, action: str) -> str:
    """Limit each privacy action by authenticated user and pseudonymous IP."""
    settings = get_settings()
    if action == "request":
        limit = settings.privacy_request_rate_limit
    elif action == "export":
        limit = settings.privacy_export_rate_limit
    else:
        limit = settings.privacy_admin_rate_limit

    ip_hash = client_ip_hash(request)
    _consume_rate_limit(session, scope=f"user:{user.id}", action=action, limit=limit)
    _consume_rate_limit(session, scope=f"ip:{ip_hash}", action=action, limit=limit)
    return ip_hash


def audit_privacy_event(
    session: Session,
    *,
    event_type: str,
    actor_user_id: UUID | None,
    ip_hash: str | None,
    privacy_request_id: UUID | None = None,
    detail: str | None = None,
) -> None:
    """Log action metadata only—never request text or exported data."""
    session.add(
        PrivacyAuditEvent(
            privacy_request_id=privacy_request_id,
            actor_user_id=actor_user_id,
            event_type=event_type,
            ip_hash=ip_hash,
            detail=detail[:200] if detail else None,
        )
    )


def transition_privacy_request(item: PrivacyRequest, next_status: str, resolution_note: str | None, admin: User) -> None:
    """Enforce the manual review workflow without any deletion side effects."""
    if next_status not in VALID_TRANSITIONS[item.status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot change a {item.status} request to {next_status}.",
        )
    if next_status == "under_review" and resolution_note:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A resolution note is only allowed for an approved or rejected request.",
        )
    if next_status in {"approved", "rejected"} and not resolution_note:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A resolution note is required when resolving a privacy request.",
        )

    item.status = next_status
    if next_status in {"approved", "rejected"}:
        item.resolved_at = datetime.now(timezone.utc)
        item.resolved_by = admin.id
        item.resolution_note = resolution_note


def _timestamp(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def build_personal_data_export(session: Session, user: User) -> dict:
    """Return only records provably owned by the authenticated user.

    Academic resources are shared content and are intentionally not exported.
    Push endpoints and cryptographic subscription keys are also omitted.
    """
    max_records = get_settings().privacy_export_max_records
    request_rows = (
        session.query(PrivacyRequest)
        .filter(PrivacyRequest.user_id == user.id)
        .order_by(PrivacyRequest.created_at.desc())
        .limit(max_records)
        .all()
    )
    read_rows = (
        session.query(NotificationRead)
        .filter(NotificationRead.user_id == user.id)
        .order_by(NotificationRead.notification_id)
        .limit(max_records)
        .all()
    )
    subscription_rows = (
        session.query(PushSubscription)
        .filter(PushSubscription.user_id == user.id)
        .order_by(PushSubscription.created_at.desc())
        .limit(max_records)
        .all()
    )
    return {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "account": {
            "id": str(user.id),
            "firebase_uid": user.firebase_uid,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": _timestamp(user.created_at),
            "updated_at": _timestamp(user.updated_at),
        },
        "notification_read_statuses": [
            {
                "notification_id": str(row.notification_id),
                "read_at": _timestamp(row.read_at),
                "dismissed_at": _timestamp(row.dismissed_at),
            }
            for row in read_rows
        ],
        "push_subscription_metadata": [
            {
                "id": str(row.id),
                "is_active": row.is_active,
                "failure_count": row.failure_count,
                "created_at": _timestamp(row.created_at),
                "updated_at": _timestamp(row.updated_at),
            }
            for row in subscription_rows
        ],
        "privacy_requests": [
            {
                "id": str(row.id),
                "request_type": row.request_type,
                "status": row.status,
                "details": row.details,
                "created_at": _timestamp(row.created_at),
                "updated_at": _timestamp(row.updated_at),
                "resolved_at": _timestamp(row.resolved_at),
                "resolution_note": row.resolution_note,
            }
            for row in request_rows
        ],
        "omissions": [
            "Passwords, authentication tokens, API keys, service credentials, and push-subscription endpoints or keys are never included.",
            "Shared academic resources and other users' data are not personal records and are not included.",
        ],
    }
