from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..event_models import Event


def require_event(session: Session, event_id: UUID) -> Event:
    event = session.get(Event, event_id)
    if not event: raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found.")
    return event


def publish(event: Event) -> Event:
    if event.status == "cancelled": raise HTTPException(status.HTTP_409_CONFLICT, "Cancelled events cannot be published.")
    event.status, event.is_published = "published", True
    return event


def cancel(event: Event) -> Event:
    event.status, event.is_published = "cancelled", False
    return event


def upcoming_query(session: Session):
    return session.query(Event).filter(Event.is_published.is_(True), Event.status.in_(("published", "ongoing")), Event.start_datetime >= datetime.now(timezone.utc)).order_by(Event.start_datetime)
