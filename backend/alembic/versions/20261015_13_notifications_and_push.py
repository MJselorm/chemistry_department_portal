"""add persistent notifications and web push subscriptions

Revision ID: 20261015_13
Revises: 20261015_12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261015_13"
down_revision = "20261015_12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("announcements", sa.Column("publication_key", sa.String(100), nullable=True))
    op.create_unique_constraint("uq_announcements_publication_key", "announcements", ["publication_key"])
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False), sa.Column("message", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="general"),
        sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("audience_type", sa.String(30), nullable=False, server_default="all_students"),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("destination_path", sa.String(500)),
        sa.Column("announcement_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("announcements.id", ondelete="CASCADE"), unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
        sa.Column("scheduled_for", sa.DateTime(timezone=True)), sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("priority IN ('normal','important','urgent')", name="notifications_priority_check"),
        sa.CheckConstraint("audience_type IN ('all_students','individual')", name="notifications_audience_check"),
        sa.CheckConstraint("status IN ('scheduled','published','cancelled','archived')", name="notifications_status_check"),
    )
    op.create_index("ix_notifications_status", "notifications", ["status"])
    op.create_index("ix_notifications_published_at", "notifications", ["published_at"])
    op.create_index("ix_notifications_scheduled_for", "notifications", ["scheduled_for"])
    op.create_table(
        "notification_reads",
        sa.Column("notification_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("notifications.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("read_at", sa.DateTime(timezone=True)), sa.Column("dismissed_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "push_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False, unique=True), sa.Column("p256dh", sa.Text(), nullable=False), sa.Column("auth", sa.Text(), nullable=False),
        sa.Column("user_agent", sa.String(500)), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("failure_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_push_subscriptions_user_id", "push_subscriptions", ["user_id"])
    op.create_table(
        "push_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("notification_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("push_subscriptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(20), nullable=False), sa.Column("error_code", sa.String(100)),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("notification_id", "subscription_id", "attempt_number", name="uq_push_delivery_attempt"),
    )
    op.create_index("ix_push_deliveries_notification_id", "push_deliveries", ["notification_id"])
    for table in ("notifications", "notification_reads", "push_subscriptions", "push_deliveries"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"REVOKE ALL ON TABLE {table} FROM anon, authenticated")


def downgrade() -> None:
    op.drop_table("push_deliveries"); op.drop_table("push_subscriptions"); op.drop_table("notification_reads"); op.drop_table("notifications")
    op.drop_constraint("uq_announcements_publication_key", "announcements", type_="unique")
    op.drop_column("announcements", "publication_key")
