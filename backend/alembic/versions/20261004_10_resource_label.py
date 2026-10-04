"""add resource labels for migrated academic folders

Revision ID: 20261004_10
Revises: 20261003_09
"""
from alembic import op


revision = "20261004_10"
down_revision = "20261003_09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE resources ADD COLUMN IF NOT EXISTS label VARCHAR(100)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_resources_label ON resources (label)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_resources_label")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS label")
