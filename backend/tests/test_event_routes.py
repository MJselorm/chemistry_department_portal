from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.event_schemas import EventCreate
from app.models import User
from app.routers.events import create_published_event


class _Session:
    def __init__(self):
        self.added = []
        self.commits = 0

    def add(self, item): self.added.append(item)
    def commit(self): self.commits += 1
    def refresh(self, _item): return None


def test_create_published_event_is_atomic():
    session = _Session()
    admin = User(id=uuid4(), firebase_uid="admin", email="admin@example.edu", role="admin")
    start = datetime.now(timezone.utc) + timedelta(days=1)
    payload = EventCreate(title="Chemistry seminar", start_datetime=start, end_datetime=start + timedelta(hours=2))

    event = create_published_event(payload, session, admin)

    assert event.status == "published"
    assert event.is_published is True
    assert session.added == [event]
    assert session.commits == 1
