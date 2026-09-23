"""seed the Chemical Department directory record

Revision ID: 20260923_04
Revises: 20260923_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20260923_04"
down_revision = "20260923_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep this idempotent for environments that were manually seeded already.
    op.execute(
        sa.text(
            """
            INSERT INTO departments (name, code, description, is_active)
            SELECT 'Chemical Department', 'CHEM', 'Departmental directory for Chemical Department.', true
            WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'CHEM')
            """
        )
    )


def downgrade() -> None:
    # Directory records reference departments restrictively, so only remove an
    # otherwise-unused seed row during a rollback.
    op.execute(
        sa.text(
            """
            DELETE FROM departments d
            WHERE d.code = 'CHEM'
              AND NOT EXISTS (SELECT 1 FROM executives e WHERE e.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM class_representatives r WHERE r.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM lecturers l WHERE l.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM courses c WHERE c.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM course_representatives r WHERE r.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM clubs c WHERE c.department_id = d.id)
              AND NOT EXISTS (SELECT 1 FROM committees c WHERE c.department_id = d.id)
            """
        )
    )
