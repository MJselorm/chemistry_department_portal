"""bring resource tables to the current metadata schema

Revision ID: 20260929_08
Revises: 20260929_07
"""
from alembic import op

revision = "20260929_08"
down_revision = "20260929_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The initial resource migration was applied before these optional Drive
    # metadata fields were introduced. IF NOT EXISTS makes this safe for every
    # existing deployment without touching resource records.
    op.execute("ALTER TABLE resource_folders ADD COLUMN IF NOT EXISTS description TEXT")
    for statement in (
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS title VARCHAR(500)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS file_name VARCHAR(500)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS web_content_link TEXT",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS semester VARCHAR(50)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS lecturer VARCHAR(255)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS department VARCHAR(255)",
        "ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_missing BOOLEAN NOT NULL DEFAULT false",
        "CREATE INDEX IF NOT EXISTS ix_resources_academic_year ON resources (academic_year)",
        "CREATE INDEX IF NOT EXISTS ix_resources_semester ON resources (semester)",
        "CREATE INDEX IF NOT EXISTS ix_resources_lecturer ON resources (lecturer)",
        "CREATE INDEX IF NOT EXISTS ix_resources_department ON resources (department)",
        "CREATE INDEX IF NOT EXISTS ix_resources_is_missing ON resources (is_missing)",
    ):
        op.execute(statement)


def downgrade() -> None:
    for statement in (
        "DROP INDEX IF EXISTS ix_resources_is_missing",
        "DROP INDEX IF EXISTS ix_resources_department",
        "DROP INDEX IF EXISTS ix_resources_lecturer",
        "DROP INDEX IF EXISTS ix_resources_semester",
        "DROP INDEX IF EXISTS ix_resources_academic_year",
        "ALTER TABLE resources DROP COLUMN IF EXISTS is_missing",
        "ALTER TABLE resources DROP COLUMN IF EXISTS department",
        "ALTER TABLE resources DROP COLUMN IF EXISTS lecturer",
        "ALTER TABLE resources DROP COLUMN IF EXISTS semester",
        "ALTER TABLE resources DROP COLUMN IF EXISTS academic_year",
        "ALTER TABLE resources DROP COLUMN IF EXISTS web_content_link",
        "ALTER TABLE resources DROP COLUMN IF EXISTS file_name",
        "ALTER TABLE resources DROP COLUMN IF EXISTS title",
        "ALTER TABLE resource_folders DROP COLUMN IF EXISTS description",
    ):
        op.execute(statement)
