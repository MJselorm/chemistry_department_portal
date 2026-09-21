from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
    full_name: str | None = Field(default=None, max_length=200)
