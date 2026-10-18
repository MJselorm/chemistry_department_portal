"""add tracked privacy requests

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
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("requester_email", sa.String(320), nullable=False),
        sa.Column("requester_name", sa.String(200)),
        sa.Column("request_type", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("reason", sa.Text()),
        sa.Column("resolution_note", sa.Text()),
        sa.Column("resolved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("request_type IN ('data_export','account_deletion')", name="privacy_requests_type_check"),
        sa.CheckConstraint("status IN ('pending','in_review','completed','rejected','cancelled')", name="privacy_requests_status_check"),
    )
    op.create_index("ix_privacy_requests_user_id", "privacy_requests", ["user_id"])
    op.create_index("ix_privacy_requests_request_type", "privacy_requests", ["request_type"])
    op.create_index("ix_privacy_requests_status", "privacy_requests", ["status"])
    op.create_index(
        "uq_privacy_requests_active_deletion",
        "privacy_requests",
        ["user_id", "request_type"],
        unique=True,
        postgresql_where=sa.text("request_type = 'account_deletion' AND status IN ('pending', 'in_review')"),
    )
    op.execute("ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE privacy_requests FROM anon, authenticated")


def downgrade() -> None:
    op.drop_table("privacy_requests")
