from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..event_models import Event
from ..models import Announcement, NotificationRead, Resource, User
from ..notification_schemas import NotificationFeed, NotificationItem
from ..security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])
DB = Annotated[Session, Depends(get_db)]
Authenticated = Annotated[User, Depends(get_current_user)]


def _message(value: str | None, fallback: str) -> str:
    compact = " ".join((value or "").split())
    return compact[:180] if compact else fallback


def _visible_items(session: Session, user: User, limit: int = 100) -> list[dict]:
    per_source = min(limit, 50)
    items: list[dict] = []
    announcement_query = session.query(Announcement)
    if user.role != "admin":
        audiences = ["All students"]
        if user.level:
            audiences.append(f"Level {user.level}")
        announcement_query = announcement_query.filter(Announcement.audience.in_(audiences))
    for announcement in announcement_query.order_by(Announcement.published_at.desc()).limit(per_source):
        items.append({
            "id": f"announcement:{announcement.id}",
            "kind": "announcement",
            "title": announcement.title,
            "message": _message(announcement.body, "A new department announcement is available."),
            "url": "/announcements",
            "created_at": announcement.published_at,
        })

    events = session.query(Event).filter(Event.is_published.is_(True), Event.status != "cancelled").order_by(Event.created_at.desc()).limit(per_source)
    for event in events:
        items.append({
            "id": f"event:{event.id}",
            "kind": "event",
            "title": event.title,
            "message": _message(event.description, f"Scheduled for {event.start_datetime:%d %b %Y}."),
            "url": "/events",
            "created_at": event.created_at,
        })

    resources = session.query(Resource).filter(
        Resource.is_active.is_(True),
        Resource.is_missing.is_(False),
        Resource.supabase_storage_path.is_not(None),
    ).order_by(Resource.created_at.desc()).limit(per_source)
    for resource in resources:
        items.append({
            "id": f"resource:{resource.id}",
            "kind": "resource",
            "title": resource.title or resource.name,
            "message": _message(resource.description, "A new academic resource is available."),
            "url": "/academic",
            "created_at": resource.created_at,
        })

    floor = datetime.min.replace(tzinfo=timezone.utc)
    items.sort(key=lambda item: item["created_at"] or floor, reverse=True)
    return items[:limit]


def _feed(session: Session, user: User, limit: int) -> NotificationFeed:
    visible = _visible_items(session, user, max(limit, 100))
    keys = [item["id"] for item in visible]
    read_keys = {
        row.item_key for row in session.query(NotificationRead).filter(
            NotificationRead.user_id == user.id,
            NotificationRead.item_key.in_(keys),
        )
    } if keys else set()
    items = [NotificationItem(**item, is_read=item["id"] in read_keys) for item in visible]
    return NotificationFeed(items=items[:limit], unread_count=sum(not item.is_read for item in items))


@router.get("", response_model=NotificationFeed)
def list_notifications(session: DB, user: Authenticated, limit: int = Query(20, ge=1, le=50)):
    return _feed(session, user, limit)


@router.post("/{item_key}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(item_key: str, session: DB, user: Authenticated):
    if item_key not in {item["id"] for item in _visible_items(session, user)}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found.")
    session.merge(NotificationRead(user_id=user.id, item_key=item_key))
    session.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(session: DB, user: Authenticated):
    for item in _visible_items(session, user):
        session.merge(NotificationRead(user_id=user.id, item_key=item["id"]))
    session.commit()
