"""backfill resource level and semester from existing folder paths

Revision ID: 20261004_11
Revises: 20261004_10
"""
from alembic import op


revision = "20261004_11"
down_revision = "20261004_10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Folder names accepted here include only chem_100, chem 100, and
    # chem-100 (and their 200/300 equivalents). This backfills records that
    # existed before the Storage indexer was introduced.
    op.execute("""
        UPDATE resources
        SET level = CASE
            WHEN folder_path ~* '(^|/)chem[ _-]*100(/|$)' THEN '100'
            WHEN folder_path ~* '(^|/)chem[ _-]*200(/|$)' THEN '200'
            WHEN folder_path ~* '(^|/)chem[ _-]*300(/|$)' THEN '300'
            ELSE level
        END,
        semester = CASE
            WHEN folder_path ~* '(^|/)(sem|semester)[ _-]*1(/|$)' THEN '1'
            WHEN folder_path ~* '(^|/)(sem|semester)[ _-]*2(/|$)' THEN '2'
            ELSE semester
        END
        WHERE folder_path ~* '(^|/)chem[ _-]*(100|200|300)(/|$)'
    """)
    op.execute("""
        UPDATE resources
        SET label = concat_ws(' · ',
            CASE WHEN level IS NOT NULL THEN 'CHEM ' || level END,
            CASE WHEN semester IS NOT NULL THEN 'Semester ' || semester END
        )
        WHERE level IN ('100', '200', '300')
    """)


def downgrade() -> None:
    # Existing values may have been manually corrected after this backfill, so
    # they are intentionally retained during downgrade.
    pass
