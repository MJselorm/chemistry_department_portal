"""normalize timestamp-prefixed academic resource display names

Revision ID: 20261004_12
Revises: 20261004_11
"""
from alembic import op


revision = "20261004_12"
down_revision = "20261004_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Only records beginning with a long export timestamp are changed. Bucket
    # object paths are deliberately left untouched.
    op.execute("""
        UPDATE resources
        SET name = regexp_replace(replace(regexp_replace(name, '^[0-9]{10,}[_-]+', ''), '_', ' '), '\\s+', ' ', 'g'),
            title = regexp_replace(replace(regexp_replace(title, '^[0-9]{10,}[_-]+', ''), '_', ' '), '\\s+', ' ', 'g'),
            file_name = regexp_replace(replace(regexp_replace(file_name, '^[0-9]{10,}[_-]+', ''), '_', ' '), '\\s+', ' ', 'g')
        WHERE name ~ '^[0-9]{10,}[_-]+'
    """)
    op.execute("""
        UPDATE resources
        SET name = 'Physical 355 resource.pdf',
            title = 'Physical 355 resource.pdf',
            file_name = 'Physical 355 resource.pdf'
        WHERE name = '_........................pdf'
          AND folder_path = 'CHEM_300/Sem_1/PHYSICAL_355'
    """)


def downgrade() -> None:
    pass
