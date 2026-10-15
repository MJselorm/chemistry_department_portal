from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Notification, NotificationRead, PushDelivery, PushSubscription, User
from ..notification_schemas import NotificationAdminOut, NotificationCreate, NotificationOut, PushSubscriptionIn, PushUnsubscribeIn
from ..security import get_current_user, require_admin
from ..services.notifications import deliver_push, eligible_clause, publish_due

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
DB = Annotated[Session, Depends(get_db)]; Auth = Annotated[User, Depends(get_current_user)]; Admin = Annotated[User, Depends(require_admin)]


def visible_query(session: Session, user: User):
    now = datetime.now(timezone.utc)
    return session.query(Notification).filter(Notification.status == "published", Notification.published_at <= now, eligible_clause(user))


def output(session: Session, item: Notification, user: User) -> NotificationOut:
    read = session.query(NotificationRead).filter_by(notification_id=item.id, user_id=user.id).first()
    data = NotificationOut.model_validate(item)
    return data.model_copy(update={"is_read": bool(read and read.read_at)})


def require_visible(session: Session, user: User, notification_id: UUID) -> Notification:
    item = visible_query(session, user).filter(Notification.id == notification_id).first()
    if not item: raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    return item


@router.get("", response_model=list[NotificationOut])
def list_notifications(session: DB, user: Auth, limit: int = 20, offset: int = 0):
    publish_due(session)
    items = visible_query(session, user).outerjoin(NotificationRead, and_(NotificationRead.notification_id == Notification.id, NotificationRead.user_id == user.id)).filter(or_(NotificationRead.dismissed_at.is_(None), NotificationRead.user_id.is_(None))).order_by(Notification.published_at.desc()).offset(max(0, offset)).limit(min(max(limit, 1), 100)).all()
    return [output(session, item, user) for item in items]


@router.get("/unread-count")
def unread_count(session: DB, user: Auth):
    publish_due(session)
    count = visible_query(session, user).outerjoin(NotificationRead, and_(NotificationRead.notification_id == Notification.id, NotificationRead.user_id == user.id)).filter(NotificationRead.read_at.is_(None), NotificationRead.dismissed_at.is_(None)).count()
    return {"unread_count": count}


@router.post("/read-all")
def read_all(session: DB, user: Auth):
    now = datetime.now(timezone.utc); items = visible_query(session, user).all()
    for item in items:
        read = session.query(NotificationRead).filter_by(notification_id=item.id, user_id=user.id).first()
        if not read: read = NotificationRead(notification_id=item.id, user_id=user.id); session.add(read)
        read.read_at = now
    session.commit(); return {"updated": len(items)}


@router.get("/push/public-key")
def push_public_key(_: Auth):
    key = get_settings().vapid_public_key
    return {"public_key": key, "configured": bool(key and get_settings().vapid_private_key)}


@router.post("/push/subscriptions", status_code=status.HTTP_201_CREATED)
def register_push(payload: PushSubscriptionIn, request: Request, session: DB, user: Auth):
    item = session.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if item and item.user_id != user.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "This browser subscription belongs to another account. Unsubscribe it before switching accounts.")
    if not item: item = PushSubscription(user_id=user.id, endpoint=payload.endpoint, p256dh=payload.p256dh, auth=payload.auth); session.add(item)
    item.p256dh, item.auth, item.is_active, item.failure_count = payload.p256dh, payload.auth, True, 0
    item.user_agent = (request.headers.get("user-agent") or "")[:500]
    session.commit(); return {"subscribed": True}


@router.post("/push/subscriptions/unsubscribe")
def unregister_push(payload: PushUnsubscribeIn, session: DB, user: Auth):
    item = session.query(PushSubscription).filter_by(endpoint=payload.endpoint, user_id=user.id).first()
    if item: session.delete(item); session.commit()
    return {"subscribed": False}


@router.get("/admin", response_model=list[NotificationAdminOut])
def admin_list(session: DB, _: Admin, limit: int = 50):
    publish_due(session); items = session.query(Notification).order_by(Notification.created_at.desc()).limit(min(limit, 100)).all()
    result = []
    for item in items:
        eligible = 1 if item.audience_type == "individual" else session.query(User).filter(User.role == "student").count()
        reads = session.query(NotificationRead).filter(NotificationRead.notification_id == item.id, NotificationRead.read_at.is_not(None)).count()
        attempts = session.query(PushDelivery).filter_by(notification_id=item.id).count()
        accepted = session.query(PushDelivery).filter_by(notification_id=item.id, status="accepted").count()
        data = NotificationAdminOut.model_validate(item).model_copy(update={"eligible_recipients": eligible, "read_count": reads, "push_attempts": attempts, "push_accepted": accepted, "push_failed": attempts - accepted})
        result.append(data)
    return result


@router.post("/admin", response_model=NotificationAdminOut, status_code=status.HTTP_201_CREATED)
def admin_create(payload: NotificationCreate, session: DB, admin: Admin):
    target = None
    if payload.audience_type == "individual":
        if not payload.target_email: raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "An individual recipient email is required.")
        target = session.query(User).filter(func.lower(User.email) == payload.target_email.lower(), User.role == "student").first()
        if not target: raise HTTPException(status.HTTP_404_NOT_FOUND, "Student recipient not found.")
    scheduled = payload.scheduled_for and payload.scheduled_for > datetime.now(timezone.utc)
    item = Notification(title=payload.title, message=payload.message, category=payload.category, priority=payload.priority, audience_type=payload.audience_type, target_user_id=target.id if target else None, destination_path=payload.destination_path, scheduled_for=payload.scheduled_for if scheduled else None, status="scheduled" if scheduled else "published", published_at=None if scheduled else datetime.now(timezone.utc), created_by_id=admin.id)
    session.add(item); session.commit(); session.refresh(item)
    if not scheduled: deliver_push(session, item)
    return NotificationAdminOut.model_validate(item)


@router.post("/admin/{notification_id}/cancel")
def cancel(notification_id: UUID, session: DB, _: Admin):
    item = session.get(Notification, notification_id)
    if not item or item.status != "scheduled": raise HTTPException(status.HTTP_409_CONFLICT, "Only scheduled notifications can be cancelled.")
    item.status = "cancelled"; session.commit(); return {"status": "cancelled"}


@router.post("/admin/{notification_id}/archive")
def archive(notification_id: UUID, session: DB, _: Admin):
    item = session.get(Notification, notification_id)
    if not item: raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    item.status = "archived"; session.commit(); return {"status": "archived"}


@router.post("/admin/{notification_id}/resend")
def resend(notification_id: UUID, session: DB, _: Admin):
    item = session.get(Notification, notification_id)
    if not item or item.status != "published": raise HTTPException(status.HTTP_409_CONFLICT, "Only published notifications can be resent.")
    deliver_push(session, item, resend=True); return {"status": "resent"}


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: UUID, session: DB, user: Auth):
    item = require_visible(session, user, notification_id); read = session.query(NotificationRead).filter_by(notification_id=item.id, user_id=user.id).first()
    if not read: read = NotificationRead(notification_id=item.id, user_id=user.id); session.add(read)
    read.read_at = datetime.now(timezone.utc); session.commit(); return output(session, item, user)


@router.post("/{notification_id}/dismiss")
def dismiss(notification_id: UUID, session: DB, user: Auth):
    item = require_visible(session, user, notification_id); read = session.query(NotificationRead).filter_by(notification_id=item.id, user_id=user.id).first()
    if not read: read = NotificationRead(notification_id=item.id, user_id=user.id); session.add(read)
    read.dismissed_at = datetime.now(timezone.utc); session.commit(); return {"dismissed": True}
