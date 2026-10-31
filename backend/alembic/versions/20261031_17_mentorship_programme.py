"""add student mentorship programme, progress tracking, and audit records

Revision ID: 20261031_17
Revises: 20261031_16
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261031_17"
down_revision = "20261031_16"
branch_labels = None
depends_on = None

UUID = postgresql.UUID(as_uuid=True)
JSONB = postgresql.JSONB(astext_type=sa.Text())


def _secure_table(name: str) -> None:
    op.execute(f"ALTER TABLE public.{name} ENABLE ROW LEVEL SECURITY")
    op.execute(f"REVOKE ALL ON TABLE public.{name} FROM PUBLIC, anon, authenticated")


def upgrade() -> None:
    op.create_table(
        "mentor_applications",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("academic_level", sa.String(20), nullable=False),
        sa.Column("subjects", JSONB, nullable=False),
        sa.Column("availability", JSONB, nullable=False),
        sa.Column("preferred_capacity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("introduction", sa.String(500)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by_id", UUID, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("review_note", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("academic_level IN ('100', '200', '300', '400', 'postgraduate')", name="mentor_applications_level_check"),
        sa.CheckConstraint("preferred_capacity BETWEEN 1 AND 5", name="mentor_applications_capacity_check"),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="mentor_applications_status_check"),
    )
    op.create_index("ix_mentor_applications_status", "mentor_applications", ["status"])
    op.create_table(
        "mentee_applications",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("academic_level", sa.String(20), nullable=False),
        sa.Column("subjects", JSONB, nullable=False),
        sa.Column("learning_goals", JSONB, nullable=False),
        sa.Column("availability", JSONB, nullable=False),
        sa.Column("preferences", sa.String(500)),
        sa.Column("status", sa.String(20), nullable=False, server_default="waiting"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("academic_level IN ('100', '200', '300', '400', 'postgraduate')", name="mentee_applications_level_check"),
        sa.CheckConstraint("status IN ('waiting', 'matched', 'completed', 'withdrawn')", name="mentee_applications_status_check"),
    )
    op.create_index("ix_mentee_applications_user_id", "mentee_applications", ["user_id"])
    op.create_index(
        "uq_mentee_application_open_user",
        "mentee_applications",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('waiting', 'matched')"),
    )
    op.create_index("ix_mentee_applications_status", "mentee_applications", ["status"])
    op.create_table(
        "mentorship_matches",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("mentor_user_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("mentee_user_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("mentee_application_id", UUID, sa.ForeignKey("mentee_applications.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="proposed"),
        sa.Column("match_score", sa.Integer, nullable=False),
        sa.Column("shared_subjects", JSONB, nullable=False),
        sa.Column("mentor_accepted_at", sa.DateTime(timezone=True)),
        sa.Column("mentee_accepted_at", sa.DateTime(timezone=True)),
        sa.Column("mentor_completed_at", sa.DateTime(timezone=True)),
        sa.Column("mentee_completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('proposed', 'active', 'completed', 'declined', 'withdrawn', 'reassigned', 'expired')", name="mentorship_matches_status_check"),
        sa.CheckConstraint("match_score BETWEEN 0 AND 100", name="mentorship_matches_score_check"),
    )
    op.create_index(
        "uq_mentorship_match_open_mentee",
        "mentorship_matches",
        ["mentee_user_id"],
        unique=True,
        postgresql_where=sa.text("status IN ('proposed', 'active')"),
    )
    op.create_index(
        "ix_mentorship_match_open_mentor",
        "mentorship_matches",
        ["mentor_user_id"],
        postgresql_where=sa.text("status IN ('proposed', 'active')"),
    )
    op.create_index("ix_mentorship_matches_status", "mentorship_matches", ["status"])
    op.create_index("ix_mentorship_matches_created_at", "mentorship_matches", ["created_at"])
    op.create_table(
        "mentorship_goals",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(250), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('active', 'completed')", name="mentorship_goals_status_check"),
    )
    op.create_index("ix_mentorship_goals_match_id", "mentorship_goals", ["match_id"])
    op.create_table(
        "mentorship_progress_notes",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_user_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("body", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_mentorship_progress_notes_match_id", "mentorship_progress_notes", ["match_id"])
    op.create_table(
        "mentorship_sessions",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("submission_key", UUID, nullable=False),
        sa.Column("session_date", sa.Date, nullable=False),
        sa.Column("topic", sa.String(200), nullable=False),
        sa.Column("notes", sa.String(1000)),
        sa.Column("status", sa.String(30), nullable=False, server_default="awaiting_confirmation"),
        sa.Column("mentor_confirmed_at", sa.DateTime(timezone=True)),
        sa.Column("mentee_confirmed_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('awaiting_confirmation', 'completed', 'cancelled')", name="mentorship_sessions_status_check"),
        sa.UniqueConstraint("match_id", "submission_key", name="uq_mentorship_session_submission"),
        sa.UniqueConstraint("match_id", "session_date", "topic", name="uq_mentorship_session_match_date_topic"),
    )
    op.create_index("ix_mentorship_sessions_match_date", "mentorship_sessions", ["match_id", "session_date"])
    op.create_table(
        "mentorship_reassignment_requests",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("requester_user_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("reason", sa.String(500)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("resolved_by_id", UUID, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("resolution_note", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="mentorship_reassignment_status_check"),
    )
    op.create_index(
        "uq_mentorship_reassignment_pending_match",
        "mentorship_reassignment_requests",
        ["match_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.create_index("ix_mentorship_reassignment_requests_status", "mentorship_reassignment_requests", ["status"])
    op.create_table(
        "mentorship_feedback",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_user_id", UUID, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("feedback", sa.String(1000)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("match_id", "author_user_id", name="uq_mentorship_feedback_author"),
    )
    op.create_table(
        "mentorship_notification_preferences",
        sa.Column("user_id", UUID, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("in_app_enabled", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "mentorship_audit",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("actor_user_id", UUID, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("subject_user_id", UUID, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("match_id", UUID, sa.ForeignKey("mentorship_matches.id", ondelete="SET NULL")),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("outcome", sa.String(40), nullable=False),
        sa.Column("details", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "event_type IN ('mentor_application', 'mentor_review', 'mentee_application', "
            "'match_proposed', 'match_decision', 'goal_update', 'session_update', "
            "'progress_note', 'completion', 'withdrawal', 'reassignment_request', 'reassignment_review')",
            name="mentorship_audit_event_check",
        ),
    )
    op.create_index("ix_mentorship_audit_created_at", "mentorship_audit", ["created_at"])
    for table in (
        "mentor_applications",
        "mentee_applications",
        "mentorship_matches",
        "mentorship_goals",
        "mentorship_progress_notes",
        "mentorship_sessions",
        "mentorship_reassignment_requests",
        "mentorship_feedback",
        "mentorship_notification_preferences",
        "mentorship_audit",
    ):
        _secure_table(table)


def downgrade() -> None:
    for table in (
        "mentorship_audit",
        "mentorship_notification_preferences",
        "mentorship_feedback",
        "mentorship_reassignment_requests",
        "mentorship_sessions",
        "mentorship_progress_notes",
        "mentorship_goals",
        "mentorship_matches",
        "mentee_applications",
        "mentor_applications",
    ):
        op.drop_table(table)
