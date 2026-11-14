from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


PrivacyRequestType = Literal["data_export", "account_deletion"]
PrivacyRequestStatus = Literal["pending", "under_review", "in_review", "approved", "completed", "rejected", "cancelled"]


class PrivacyRequestCreate(BaseModel):
    """Only user-controlled request fields are accepted from the browser."""

    model_config = ConfigDict(extra="forbid")

    request_type: PrivacyRequestType
    details: str | None = Field(default=None, max_length=2000)

    @field_validator("details")
    @classmethod
    def normalize_details(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class AccountDeletionRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


class PrivacyRequestUpdate(BaseModel):
    status: PrivacyRequestStatus
    resolution_note: str | None = Field(default=None, max_length=2000)


class PrivacyRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    request_type: PrivacyRequestType
    status: PrivacyRequestStatus
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    reason: str | None = None
    details: str | None = None
    resolution_note: str | None = None

class PrivacyRequestPage(BaseModel):
    items: list[PrivacyRequestOut]
    limit: int
    offset: int
    total: int


class PrivacyRequestAdminOut(PrivacyRequestOut):
    user_id: UUID | None
    requester_email: str
    requester_name: str | None = None
    details: str | None = None
    resolved_by: UUID | None = None
    reason: str | None = None


class PrivacyRequestAdminPage(BaseModel):
    items: list[PrivacyRequestAdminOut]
    limit: int
    offset: int
    total: int


class PrivacyRequestReview(BaseModel):
    """Administrators may only advance a request through its defined workflow."""

    model_config = ConfigDict(extra="forbid")

    status: PrivacyRequestStatus
    resolution_note: str | None = Field(default=None, max_length=2000)

    @field_validator("resolution_note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

class AdminPrivacyRequestOut(PrivacyRequestOut):
    user_id: UUID | None
    requester_email: str
    requester_name: str | None


class DataExportResponse(BaseModel):
    generated_at: datetime
    request: PrivacyRequestOut
    account: dict
    notification_read_state: list[dict]
    push_subscriptions: list[dict]
    privacy_requests: list[PrivacyRequestOut]
