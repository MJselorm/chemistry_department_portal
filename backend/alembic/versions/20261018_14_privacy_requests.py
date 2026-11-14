"""add reviewed privacy request workflow

Revision ID: 20261018_14
Revises: 20261015_13
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20261018_14"
down_revision = "20261015_13"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "privacy_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("request_type", sa.String(30), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.CheckConstraint("request_type IN ('data_export', 'account_deletion')", name="privacy_requests_type_check"),
        sa.CheckConstraint("status IN ('pending', 'under_review', 'approved', 'rejected')", name="privacy_requests_status_check"),
    )
    op.create_index("ix_privacy_requests_user_id", "privacy_requests", ["user_id"])
    op.create_index("ix_privacy_requests_status", "privacy_requests", ["status"])
    op.create_index("ix_privacy_requests_user_created_at", "privacy_requests", ["user_id", "created_at"])
    # Active requests include under-review requests, preventing a second
    # concurrent request from being opened while the first is unresolved.
    op.execute(
        "CREATE UNIQUE INDEX uq_privacy_requests_active_type "
        "ON privacy_requests (user_id, request_type) "
        "WHERE status IN ('pending', 'under_review')"
    )

    op.create_table(
        "privacy_audit_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("privacy_request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("privacy_requests.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("detail", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_privacy_audit_events_request_id", "privacy_audit_events", ["privacy_request_id"])
    op.create_index("ix_privacy_audit_events_actor_user_id", "privacy_audit_events", ["actor_user_id"])
    op.create_index("ix_privacy_audit_events_event_type", "privacy_audit_events", ["event_type"])
    op.create_index("ix_privacy_audit_events_created_at", "privacy_audit_events", ["created_at"])
    op.create_index("ix_privacy_audit_events_actor_created_at", "privacy_audit_events", ["actor_user_id", "created_at"])

    op.create_table(
        "privacy_rate_limits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("scope", sa.String(130), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("scope", "action", "window_started_at", name="uq_privacy_rate_limit_window"),
    )

    # Privacy data is accessed through FastAPI's trusted database connection.
    # Direct Supabase browser roles have no grants and no policies to bypass RLS.
    for table in ("privacy_requests", "privacy_audit_events", "privacy_rate_limits"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"REVOKE ALL ON TABLE {table} FROM anon, authenticated")


def downgrade() -> None:
    # Roll back only before production use or after an approved audit-data export;
    # this removes workflow and audit records by design.
    op.drop_table("privacy_rate_limits")
    op.drop_table("privacy_audit_events")
    op.drop_index("uq_privacy_requests_active_type", table_name="privacy_requests")
    op.drop_index("ix_privacy_requests_user_created_at", table_name="privacy_requests")
    op.drop_index("ix_privacy_requests_status", table_name="privacy_requests")
    op.drop_index("ix_privacy_requests_user_id", table_name="privacy_requests")
    op.drop_table("privacy_requests")
