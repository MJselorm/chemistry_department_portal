"""add normalized student directory tables

Revision ID: 20260923_03
Revises: 20260920_02
"""
from alembic import op
from app.database import Base
from app import directory_models  # noqa: F401

revision = "20260923_03"
down_revision = "20260920_02"
branch_labels = None
depends_on = None

TABLES = [
    "departments", "lecturers", "executives", "class_representatives", "courses",
    "course_representatives", "lecturer_consultations", "clubs", "committees",
    "committee_members", "department_contacts",
]

def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, tables=[Base.metadata.tables[name] for name in TABLES])

def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind, tables=[Base.metadata.tables[name] for name in reversed(TABLES)])
