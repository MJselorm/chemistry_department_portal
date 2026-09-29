from datetime import datetime

import pytest
from pydantic import ValidationError

from app.event_schemas import EventCreate


def payload(**changes):
    base = {"title": "Chemistry Seminar", "start_datetime": "2026-10-08T09:00:00+00:00", "end_datetime": "2026-10-08T11:00:00+00:00"}
    return base | changes


def test_event_create_defaults_are_valid():
    event = EventCreate(**payload())
    assert event.title == "Chemistry Seminar"


def test_event_rejects_end_before_start():
    with pytest.raises(ValidationError, match="end_datetime"):
        EventCreate(**payload(end_datetime="2026-10-08T08:00:00+00:00"))


def test_event_rejects_naive_dates():
    with pytest.raises(ValidationError, match="timezone"):
        EventCreate(**payload(start_datetime="2026-10-08T09:00:00"))
