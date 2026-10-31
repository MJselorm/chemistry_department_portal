import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class MentorApplication(Base):
    __tablename__ = "mentor_applications"
    __table_args__ = (
        CheckConstraint(
            "academic_level IN ('100', '200', '300', '400', 'postgraduate')",
            name="mentor_applications_level_check",
        ),
        CheckConstraint("preferred_capacity BETWEEN 1 AND 5", name="mentor_applications_capacity_check"),
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="mentor_applications_status_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    academic_level: Mapped[str] = mapped_column(String(20), nullable=False)
    subjects: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    availability: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    preferred_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    introduction: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    review_note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class MenteeApplication(Base):
    __tablename__ = "mentee_applications"
    __table_args__ = (
        CheckConstraint(
            "academic_level IN ('100', '200', '300', '400', 'postgraduate')",
            name="mentee_applications_level_check",
        ),
        CheckConstraint("status IN ('waiting', 'matched', 'completed', 'withdrawn')", name="mentee_applications_status_check"),
        Index(
            "uq_mentee_application_open_user",
            "user_id",
            unique=True,
            postgresql_where=text("status IN ('waiting', 'matched')"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_level: Mapped[str] = mapped_column(String(20), nullable=False)
    subjects: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    learning_goals: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    availability: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    preferences: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="waiting", server_default="waiting", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class MentorshipMatch(Base):
    __tablename__ = "mentorship_matches"
    __table_args__ = (
        CheckConstraint(
            "status IN ('proposed', 'active', 'completed', 'declined', 'withdrawn', 'reassigned', 'expired')",
            name="mentorship_matches_status_check",
        ),
        CheckConstraint("match_score BETWEEN 0 AND 100", name="mentorship_matches_score_check"),
        Index(
            "uq_mentorship_match_open_mentee",
            "mentee_user_id",
            unique=True,
            postgresql_where=text("status IN ('proposed', 'active')"),
        ),
        Index(
            "ix_mentorship_match_open_mentor",
            "mentor_user_id",
            postgresql_where=text("status IN ('proposed', 'active')"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    mentee_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    mentee_application_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentee_applications.id", ondelete="RESTRICT"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="proposed", server_default="proposed", index=True)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    shared_subjects: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    mentor_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mentee_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mentor_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mentee_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class MentorshipGoal(Base):
    __tablename__ = "mentorship_goals"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'completed')", name="mentorship_goals_status_check"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(250), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", server_default="active")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MentorshipProgressNote(Base):
    __tablename__ = "mentorship_progress_notes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    author_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    body: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MentorshipSession(Base):
    __tablename__ = "mentorship_sessions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('awaiting_confirmation', 'completed', 'cancelled')",
            name="mentorship_sessions_status_check",
        ),
        UniqueConstraint("match_id", "submission_key", name="uq_mentorship_session_submission"),
        UniqueConstraint("match_id", "session_date", "topic", name="uq_mentorship_session_match_date_topic"),
        Index("ix_mentorship_sessions_match_date", "match_id", "session_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False)
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    submission_key: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="awaiting_confirmation", server_default="awaiting_confirmation")
    mentor_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mentee_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MentorshipReassignmentRequest(Base):
    __tablename__ = "mentorship_reassignment_requests"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="mentorship_reassignment_status_check"),
        Index(
            "uq_mentorship_reassignment_pending_match",
            "match_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="RESTRICT"), nullable=False)
    requester_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    resolved_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    resolution_note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class MentorshipFeedback(Base):
    __tablename__ = "mentorship_feedback"
    __table_args__ = (UniqueConstraint("match_id", "author_user_id", name="uq_mentorship_feedback_author"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False)
    author_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    feedback: Mapped[str | None] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MentorshipNotificationPreference(Base):
    __tablename__ = "mentorship_notification_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    in_app_enabled: Mapped[bool] = mapped_column(nullable=False, default=True, server_default=text("true"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class MentorshipAudit(Base):
    __tablename__ = "mentorship_audit"
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('mentor_application', 'mentor_review', 'mentee_application', "
            "'match_proposed', 'match_decision', 'goal_update', 'session_update', "
            "'progress_note', 'completion', 'withdrawal', 'reassignment_request', 'reassignment_review')",
            name="mentorship_audit_event_check",
        ),
        Index("ix_mentorship_audit_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    subject_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    match_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("mentorship_matches.id", ondelete="SET NULL"))
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    outcome: Mapped[str] = mapped_column(String(40), nullable=False)
    details: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
