from datetime import datetime, timezone
from uuid import uuid4

from app.models import Announcement, Notification, User
from app.routers import announcements as routes
from app.schemas import AnnouncementCreate


class _AnnouncementQuery:
    def __init__(self, existing):
        self.existing = existing

    def filter(self, *_args):
        return self

    def first(self):
        return self.existing


class _Session:
    def __init__(self, existing=None):
        self.existing = existing
        self.added = []
        self.commits = 0

    def query(self, model):
        assert model is Announcement
        return _AnnouncementQuery(self.existing)

    def add(self, item):
        self.added.append(item)

    def flush(self):
        announcement = next(item for item in self.added if isinstance(item, Announcement))
        announcement.id = uuid4()
        announcement.published_at = datetime.now(timezone.utc)

    def commit(self):
        self.commits += 1

    def refresh(self, _item):
        return None


def _payload():
    return AnnouncementCreate(
        title="Exam timetable",
        body="The timetable is now available.",
        publication_key="publish-request-123",
    )


def test_publishing_announcement_creates_one_linked_notification(monkeypatch):
    session = _Session()
    admin = User(id=uuid4(), firebase_uid="admin", email="admin@example.edu", role="admin")
    delivered = []
    monkeypatch.setattr(routes, "deliver_push", lambda _session, item: delivered.append(item))

    announcement = routes.create_announcement(_payload(), session, admin)

    notifications = [item for item in session.added if isinstance(item, Notification)]
    assert len(notifications) == 1
    assert notifications[0].announcement_id == announcement.id
    assert notifications[0].destination_path == f"/announcements?announcement={announcement.id}"
    assert delivered == notifications
    assert session.commits == 1


def test_retried_announcement_publication_is_idempotent(monkeypatch):
    existing = Announcement(
        id=uuid4(),
        title="Exam timetable",
        body="Published",
        publication_key="publish-request-123",
        created_by_id=uuid4(),
        published_at=datetime.now(timezone.utc),
    )
    session = _Session(existing=existing)
    admin = User(id=uuid4(), firebase_uid="admin", email="admin@example.edu", role="admin")
    delivered = []
    monkeypatch.setattr(routes, "deliver_push", lambda *_args: delivered.append(True))

    result = routes.create_announcement(_payload(), session, admin)

    assert result is existing
    assert session.added == []
    assert session.commits == 0
    assert delivered == []
