"""add shared API rate-limit buckets

Revision ID: 20261101_18
Revises: 20261031_17
"""
from alembic import op
import sqlalchemy as sa

revision = "20261101_18"
down_revision = "20261031_17"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_rate_limits",
        sa.Column("scope", sa.String(100), primary_key=True),
        sa.Column("identifier_hash", sa.String(64), primary_key=True),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("request_count", sa.Integer, nullable=False, server_default="1"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("request_count >= 1", name="api_rate_limits_count_check"),
    )
    op.create_index("ix_api_rate_limits_expires_at", "api_rate_limits", ["expires_at"])
    op.execute("ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC, anon, authenticated")


def downgrade() -> None:
    op.drop_table("api_rate_limits")
