from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, model_validator

EventStatus = Literal["draft", "published", "ongoing", "completed", "cancelled"]


class EventFields(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=10000)
    event_type: str | None = Field(default=None, max_length=100)
    organizer: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    start_datetime: datetime
    end_datetime: datetime
    registration_url: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=2000)
    capacity: int | None = Field(default=None, ge=1)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=50)
    department: str | None = Field(default=None, max_length=255)
    target_audience: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def dates_are_ordered(self):
        if self.start_datetime.tzinfo is None or self.end_datetime.tzinfo is None:
            raise ValueError("Event dates must include a timezone.")
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime.")
        return self


class EventCreate(EventFields):
    pass


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=10000)
    event_type: str | None = Field(default=None, max_length=100)
    organizer: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    start_datetime: datetime | None = None; end_datetime: datetime | None = None
    registration_url: str | None = Field(default=None, max_length=2000); image_url: str | None = Field(default=None, max_length=2000)
    capacity: int | None = Field(default=None, ge=1); contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=50); department: str | None = Field(default=None, max_length=255)
    target_audience: str | None = Field(default=None, max_length=255); status: EventStatus | None = None; is_published: bool | None = None


class EventOut(EventFields):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; status: EventStatus; is_published: bool; created_by: UUID; created_at: datetime; updated_at: datetime


class EventPage(BaseModel):
    items: list[EventOut]; page: int; limit: int; total: int; total_pages: int
