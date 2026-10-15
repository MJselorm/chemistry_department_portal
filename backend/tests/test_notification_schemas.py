from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.notification_schemas import NotificationCreate, PushSubscriptionIn


def test_notification_accepts_safe_local_destination_and_utc_schedule():
    payload = NotificationCreate(
        title="Exam timetable",
        message="The timetable has been published.",
        destination_path="/announcements?announcement=123",
        scheduled_for=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    assert payload.destination_path.startswith("/announcements")


@pytest.mark.parametrize("destination", ["https://evil.example", "//evil.example", "/\\evil"])
def test_notification_rejects_external_or_ambiguous_destinations(destination):
    with pytest.raises(ValidationError):
        NotificationCreate(title="Update", message="Read this", destination_path=destination)


def test_notification_rejects_naive_scheduled_time():
    with pytest.raises(ValidationError):
        NotificationCreate(title="Update", message="Read this", scheduled_for=datetime.now())


def test_push_subscription_requires_browser_keys():
    with pytest.raises(ValidationError):
        PushSubscriptionIn(endpoint="https://push.example/subscription", p256dh="short", auth="short")


def test_push_subscription_rejects_untrusted_delivery_host():
    with pytest.raises(ValidationError):
        PushSubscriptionIn(endpoint="https://internal.example/push", p256dh="p" * 32, auth="a" * 16)


def test_push_subscription_accepts_known_browser_push_service():
    payload = PushSubscriptionIn(
        endpoint="https://fcm.googleapis.com/fcm/send/subscription-id",
        p256dh="p" * 32,
        auth="a" * 16,
    )
    assert payload.endpoint.startswith("https://fcm.googleapis.com/")
