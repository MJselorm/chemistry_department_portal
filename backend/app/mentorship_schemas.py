from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


AcademicLevel = Literal["100", "200", "300", "400", "postgraduate"]


def normalize_list(values: list[str]) -> list[str]:
    cleaned = list(dict.fromkeys(" ".join(value.split()) for value in values if value.strip()))
    if not cleaned:
        raise ValueError("Provide at least one item.")
    if any(len(value) > 100 for value in cleaned):
        raise ValueError("Each item must be no longer than 100 characters.")
    return cleaned


class MentorApplicationCreate(BaseModel):
    academic_level: AcademicLevel
    subjects: list[str] = Field(min_length=1, max_length=20)
    availability: list[str] = Field(min_length=1, max_length=14)
    preferred_capacity: int = Field(default=1, ge=1, le=5)
    introduction: str | None = Field(default=None, max_length=500)

    @field_validator("subjects", "availability")
    @classmethod
    def normalize_entries(cls, values: list[str]) -> list[str]:
        return normalize_list(values)

    @field_validator("introduction")
    @classmethod
    def clean_introduction(cls, value: str | None) -> str | None:
        return value.strip() or None if value else None


class MenteeApplicationCreate(BaseModel):
    academic_level: AcademicLevel
    subjects: list[str] = Field(min_length=1, max_length=20)
    learning_goals: list[str] = Field(min_length=1, max_length=10)
    availability: list[str] = Field(min_length=1, max_length=14)
    preferences: str | None = Field(default=None, max_length=500)

    @field_validator("subjects", "learning_goals", "availability")
    @classmethod
    def normalize_entries(cls, values: list[str]) -> list[str]:
        return normalize_list(values)

    @field_validator("preferences")
    @classmethod
    def clean_preferences(cls, value: str | None) -> str | None:
        return value.strip() or None if value else None


class MentorApplicationDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    note: str | None = Field(default=None, max_length=500)


class MatchDecision(BaseModel):
    decision: Literal["accept", "decline"]


class GoalCreate(BaseModel):
    title: str = Field(min_length=3, max_length=250)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 3:
            raise ValueError("Goal must contain at least 3 characters.")
        return value


class ProgressNoteCreate(BaseModel):
    body: str = Field(min_length=2, max_length=1000)

    @field_validator("body")
    @classmethod
    def clean_body(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Progress note must contain at least 2 characters.")
        return value


class SessionCreate(BaseModel):
    submission_key: UUID
    session_date: date
    topic: str = Field(min_length=2, max_length=200)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, value: str) -> str:
        value = " ".join(value.split()).casefold()
        if len(value) < 2:
            raise ValueError("Topic must contain at least 2 characters.")
        return value

    @field_validator("notes")
    @classmethod
    def clean_notes(cls, value: str | None) -> str | None:
        return value.strip() or None if value else None


class ReassignmentCreate(BaseModel):
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, value: str | None) -> str | None:
        return value.strip() or None if value else None


class ReassignmentDecision(BaseModel):
    resolution_note: str | None = Field(default=None, max_length=500)


class CompletionCreate(BaseModel):
    feedback: str | None = Field(default=None, max_length=1000)

    @field_validator("feedback")
    @classmethod
    def clean_feedback(cls, value: str | None) -> str | None:
        return value.strip() or None if value else None


class NotificationPreferenceUpdate(BaseModel):
    in_app_enabled: bool


class MentorshipGoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    status: Literal["active", "completed"]
    created_by_id: UUID
    completed_at: datetime | None
    created_at: datetime


class MentorshipSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_date: date
    topic: str
    notes: str | None
    status: Literal["awaiting_confirmation", "completed", "cancelled"]
    mentor_confirmed_at: datetime | None
    mentee_confirmed_at: datetime | None
    completed_at: datetime | None
    created_by_id: UUID
    created_at: datetime
