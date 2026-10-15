from datetime import datetime
from typing import Literal
from urllib.parse import urlparse
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def safe_destination(value: str | None) -> str | None:
    if value is None or value == "": return None
    if not value.startswith("/") or value.startswith("//") or "\\" in value:
        raise ValueError("Destination must be a local portal path.")
    return value


class NotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)
    category: str = Field(default="general", min_length=1, max_length=50)
    priority: Literal["normal", "important", "urgent"] = "normal"
    audience_type: Literal["all_students", "individual"] = "all_students"
    target_email: EmailStr | None = None
    destination_path: str | None = Field(default=None, max_length=500)
    scheduled_for: datetime | None = None

    _destination = field_validator("destination_path")(safe_destination)

    @field_validator("scheduled_for")
    @classmethod
    def scheduled_time_has_timezone(cls, value: datetime | None):
        if value is not None and value.tzinfo is None:
            raise ValueError("Scheduled publication time must include a timezone.")
        return value


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; title: str; message: str; category: str; priority: str
    destination_path: str | None; announcement_id: UUID | None
    published_at: datetime | None; created_at: datetime
    is_read: bool = False


class NotificationAdminOut(NotificationOut):
    audience_type: str; target_user_id: UUID | None; status: str
    scheduled_for: datetime | None; eligible_recipients: int = 0
    read_count: int = 0; push_attempts: int = 0; push_accepted: int = 0; push_failed: int = 0


class PushSubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=4000)
    p256dh: str = Field(min_length=16, max_length=1000)
    auth: str = Field(min_length=8, max_length=500)

    @field_validator("endpoint")
    @classmethod
    def endpoint_is_browser_push_service(cls, value: str):
        parsed = urlparse(value)
        host = (parsed.hostname or "").lower()
        allowed_hosts = {
            "fcm.googleapis.com",
            "updates.push.services.mozilla.com",
            "web.push.apple.com",
        }
        if parsed.scheme != "https" or host not in allowed_hosts or parsed.username or parsed.password:
            raise ValueError("Unsupported browser push endpoint.")
        return value


class PushUnsubscribeIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=4000)
