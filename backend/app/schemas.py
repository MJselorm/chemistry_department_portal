from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    firebase_uid: str
    email: EmailStr
    full_name: str | None = None
    role: Literal["admin", "student"]
    created_at: datetime
    updated_at: datetime


class UpdateMyProfile(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Display name must contain at least 2 characters.")
        return normalized


class AdminRoleUpdate(BaseModel):
    role: Literal["admin", "student"]


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10000)
    category: str = Field(default="Department", min_length=1, max_length=50)
    audience: Literal["All students"] = "All students"
    issuer: str = Field(default="Chemistry Board of Studies", min_length=1, max_length=200)
    is_pinned: bool = False
    publication_key: str | None = Field(default=None, min_length=8, max_length=100)


class AnnouncementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    body: str
    category: str
    audience: str
    issuer: str
    is_pinned: bool
    published_at: datetime
