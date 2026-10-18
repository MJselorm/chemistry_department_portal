from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PrivacyRequestType = Literal["data_export", "account_deletion"]
PrivacyRequestStatus = Literal["pending", "in_review", "completed", "rejected", "cancelled"]


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
    reason: str | None
    resolution_note: str | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None


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
