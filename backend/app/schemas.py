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
    student_id: str | None = None
    level: str | None = None
    has_profile_photo: bool = False
    role: Literal["admin", "student"]
    created_at: datetime
    updated_at: datetime


class UpdateMyProfile(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    student_id: str | None = Field(default=None, max_length=50, pattern=r"^[A-Za-z0-9/_-]*$")
    level: str | None = Field(default=None, pattern=r"^(100|200|300|400|Postgraduate)$")

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("student_id", "level", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        if not isinstance(value, str):
            return value
        return value.strip() or None


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10000)
    category: str = Field(default="Department", min_length=1, max_length=50)
    audience: str = Field(default="All students", max_length=50)
    issuer: str = Field(default="Chemistry Board of Studies", min_length=1, max_length=200)
    is_pinned: bool = False


class AnnouncementOut(AnnouncementCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    published_at: datetime
