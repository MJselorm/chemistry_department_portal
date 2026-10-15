import json
from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Notification, NotificationRead, PushDelivery, PushSubscription, User


def eligible_clause(user: User):
    return or_(
        and_(Notification.audience_type == "all_students", user.role == "student"),
        and_(Notification.audience_type == "individual", Notification.target_user_id == user.id),
    )


def publish_due(session: Session) -> list[Notification]:
    now = datetime.now(timezone.utc)
    due = session.query(Notification).filter(Notification.status == "scheduled", Notification.scheduled_for <= now).all()
    for item in due:
        item.status, item.published_at = "published", now
    if due: session.commit()
    for item in due: deliver_push(session, item)
    return due


def _subscriptions(session: Session, item: Notification):
    query = session.query(PushSubscription).join(User, User.id == PushSubscription.user_id).filter(PushSubscription.is_active.is_(True))
    if item.audience_type == "individual": return query.filter(PushSubscription.user_id == item.target_user_id).all()
    return query.filter(User.role == "student").all()


def deliver_push(session: Session, item: Notification, *, resend: bool = False) -> None:
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_subject: return
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        return
    for subscription in _subscriptions(session, item):
        previous = session.query(PushDelivery).filter_by(notification_id=item.id, subscription_id=subscription.id).count()
        if previous and not resend: continue
        status, code = "accepted", None
        try:
            webpush(
                subscription_info={"endpoint": subscription.endpoint, "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth}},
                data=json.dumps({"title": item.title, "body": "Open Chemistry Hub to view this update.", "url": item.destination_path or "/dashboard", "notificationId": str(item.id)}),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
                timeout=10,
            )
            subscription.failure_count = 0
        except WebPushException as exc:
            status = "failed"; code = str(getattr(exc.response, "status_code", "delivery_error"))[:100]
            subscription.failure_count += 1
            if code in {"404", "410"}: subscription.is_active = False
        except Exception:
            status, code = "failed", "delivery_error"; subscription.failure_count += 1
        session.add(PushDelivery(notification_id=item.id, subscription_id=subscription.id, attempt_number=previous + 1, status=status, error_code=code))
    session.commit()
