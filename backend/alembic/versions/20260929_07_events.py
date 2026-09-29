"""add isolated events table

Revision ID: 20260929_07
Revises: 20260924_06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260929_07"
down_revision = "20260924_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True), sa.Column("title", sa.String(300), nullable=False), sa.Column("description", sa.Text()), sa.Column("event_type", sa.String(100)), sa.Column("organizer", sa.String(255)), sa.Column("location", sa.String(255)), sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False), sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False), sa.Column("registration_url", sa.Text()), sa.Column("image_url", sa.Text()), sa.Column("capacity", sa.Integer()), sa.Column("contact_email", sa.String(255)), sa.Column("contact_phone", sa.String(50)), sa.Column("department", sa.String(255)), sa.Column("target_audience", sa.String(255)), sa.Column("status", sa.String(20), nullable=False, server_default="draft"), sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")), sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.CheckConstraint("status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')", name="events_status_check"))
    for column in ("title", "event_type", "organizer", "location", "start_datetime", "department", "status", "is_published", "created_by"):
        op.create_index(f"ix_events_{column}", "events", [column])


def downgrade() -> None:
    op.drop_table("events")
