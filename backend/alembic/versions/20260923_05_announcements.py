"""add announcements

Revision ID: 20260923_05
Revises: 20260923_04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260923_05"
down_revision = "20260923_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="Department"),
        sa.Column("audience", sa.String(length=50), nullable=False, server_default="All students"),
        sa.Column("issuer", sa.String(length=200), nullable=False, server_default="Chemistry Board of Studies"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
    )
    op.create_index("ix_announcements_published_at", "announcements", ["published_at"])


def downgrade() -> None:
    op.drop_index("ix_announcements_published_at", table_name="announcements")
    op.drop_table("announcements")
