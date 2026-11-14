"""Add notification event idempotency keys.

Revision ID: 20261108_19
Revises: 20261101_18
"""
from alembic import op
import sqlalchemy as sa

revision = "20261108_19"
down_revision = "20261101_18"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("event_key", sa.String(length=180), nullable=True))
    op.create_unique_constraint("uq_notifications_event_key", "notifications", ["event_key"])


def downgrade() -> None:
    op.drop_constraint("uq_notifications_event_key", "notifications", type_="unique")
    op.drop_column("notifications", "event_key")
