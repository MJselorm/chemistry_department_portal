"""remove obsolete Google Drive resource metadata

Revision ID: 20261015_12
Revises: 20261004_11
"""
from alembic import op


revision = "20261015_12"
down_revision = "20261004_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing resource rows and their Supabase object locations are retained.
    # The old Drive-only identifiers and URLs are no longer part of the runtime
    # data model now that Academic Storage is the sole file source.
    op.execute("ALTER TABLE resource_folders ADD COLUMN IF NOT EXISTS parent_folder_path TEXT")
    op.execute(
        """
        UPDATE resource_folders
        SET parent_folder_path = CASE
            WHEN folder_path LIKE '%/%' THEN regexp_replace(folder_path, '/[^/]+$', '')
            ELSE NULL
        END
        WHERE parent_folder_path IS NULL
        """
    )

    op.execute("ALTER TABLE resource_folders DROP CONSTRAINT IF EXISTS uq_resource_folders_drive_id")
    op.execute("DROP INDEX IF EXISTS ix_resource_folders_drive_id")
    op.execute("ALTER TABLE resource_folders DROP COLUMN IF EXISTS parent_drive_folder_id")
    op.execute("ALTER TABLE resource_folders DROP COLUMN IF EXISTS google_drive_folder_id")

    op.execute("ALTER TABLE resources DROP CONSTRAINT IF EXISTS uq_resources_drive_file_id")
    op.execute("DROP INDEX IF EXISTS ix_resources_google_drive_file_id")
    op.execute("DROP INDEX IF EXISTS ix_resources_google_drive_parent_id")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS web_content_link")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS web_view_link")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS last_modified_drive")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS google_drive_parent_id")
    op.execute("ALTER TABLE resources DROP COLUMN IF EXISTS google_drive_file_id")


def downgrade() -> None:
    raise NotImplementedError(
        "This migration intentionally removes obsolete Drive metadata and cannot restore it."
    )
