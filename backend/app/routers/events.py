import math
from datetime import date, datetime, time, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..event_models import Event
from ..event_schemas import EventCreate, EventOut, EventPage, EventUpdate
from ..models import User
from ..security import get_current_user, require_admin
from ..services.event_service import cancel, publish, require_event, upcoming_query

router = APIRouter(prefix="/api/events", tags=["Events"])
DB = Annotated[Session, Depends(get_db)]
UserAuth = Annotated[User, Depends(get_current_user)]
Admin = Annotated[User, Depends(require_admin)]


@router.get("/health")
def health(_: UserAuth): return {"status": "ok", "module": "events"}


@router.get("/upcoming", response_model=list[EventOut])
def upcoming(session: DB, _: UserAuth, limit: int = Query(10, ge=1, le=100)):
    return upcoming_query(session).limit(limit).all()


@router.get("", response_model=EventPage)
def list_events(session: DB, user: UserAuth, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), search: str | None = Query(None, max_length=200), event_type: str | None = None, department: str | None = None, organizer: str | None = None, location: str | None = None, status_filter: str | None = Query(None, alias="status"), include_all: bool = Query(False), date_from: date | None = None, date_to: date | None = None):
    query = session.query(Event)
    if not (user.role == "admin" and include_all):
        query = query.filter(Event.is_published.is_(True), Event.status != "cancelled")
    if search:
        term = f"%{search}%"; query = query.filter(or_(Event.title.ilike(term), Event.description.ilike(term)))
    for column, value in ((Event.event_type, event_type), (Event.department, department), (Event.organizer, organizer), (Event.location, location), (Event.status, status_filter)):
        if value: query = query.filter(column.ilike(f"%{value}%"))
    if date_from: query = query.filter(Event.start_datetime >= datetime.combine(date_from, time.min, tzinfo=timezone.utc))
    if date_to: query = query.filter(Event.start_datetime <= datetime.combine(date_to, time.max, tzinfo=timezone.utc))
    total = query.count(); return {"items": query.order_by(Event.start_datetime).offset((page - 1) * limit).limit(limit).all(), "page": page, "limit": limit, "total": total, "total_pages": math.ceil(total / limit) if total else 0}


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, session: DB, admin: Admin):
    event = Event(**payload.model_dump(), created_by=admin.id)
    session.add(event); session.commit(); session.refresh(event); return event


@router.get("/{event_id}", response_model=EventOut)
def event_detail(event_id: UUID, session: DB, user: UserAuth):
    event = require_event(session, event_id)
    if not event.is_published and user.role != "admin": raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found.")
    return event


@router.patch("/{event_id}", response_model=EventOut)
def update_event(event_id: UUID, payload: EventUpdate, session: DB, _: Admin):
    event = require_event(session, event_id)
    changes = payload.model_dump(exclude_unset=True)
    start, end = changes.get("start_datetime", event.start_datetime), changes.get("end_datetime", event.end_datetime)
    if start.tzinfo is None or end.tzinfo is None or end <= start: raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "end_datetime must be after timezone-aware start_datetime.")
    for field, value in changes.items(): setattr(event, field, value)
    session.commit(); session.refresh(event); return event


@router.delete("/{event_id}", response_model=EventOut)
def delete_event(event_id: UUID, session: DB, _: Admin):
    event = cancel(require_event(session, event_id)); session.commit(); session.refresh(event); return event


@router.post("/{event_id}/publish", response_model=EventOut)
def publish_event(event_id: UUID, session: DB, _: Admin):
    event = publish(require_event(session, event_id)); session.commit(); session.refresh(event); return event


@router.post("/{event_id}/cancel", response_model=EventOut)
def cancel_event(event_id: UUID, session: DB, _: Admin):
    event = cancel(require_event(session, event_id)); session.commit(); session.refresh(event); return event
