"""record private academic Storage locations

Revision ID: 20261003_09
Revises: 20260929_08
"""
from alembic import op

revision = "20261003_09"
down_revision = "20260929_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE resources ADD COLUMN IF NOT EXISTS supabase_bucket VARCHAR(255)")
    op.execute("ALTER TABLE resources ADD COLUMN IF NOT EXISTS supabase_storage_path TEXT")
    op.execute("ALTER TABLE resources ADD COLUMN IF NOT EXISTS storage_migrated_at TIMESTAMPTZ")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_resources_storage_location ON resources (supabase_bucket, supabase_storage_path) WHERE supabase_storage_path IS NOT NULL")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_resources_storage_location")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS storage_migrated_at")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS supabase_storage_path")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS supabase_bucket")
