"""limit user roles to admin and student

Revision ID: 20260920_02
Revises: 20260917_01
Create Date: 2026-09-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260920_02"
down_revision = "20260917_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The legacy constraint only permits uppercase values, so remove it before
    # normalizing existing rows to the new lowercase vocabulary.
    op.drop_constraint("users_role_check", "users", schema="public", type_="check")
    # Preserve existing privileged accounts while normalizing old role names.
    op.execute("UPDATE public.users SET role = 'admin' WHERE role IN ('ADMIN', 'SUPER_ADMIN', 'admin')")
    op.execute("UPDATE public.users SET role = 'student' WHERE role NOT IN ('admin')")
    op.alter_column(
        "users",
        "role",
        schema="public",
        existing_type=sa.String(length=20),
        server_default="student",
    )
    op.create_check_constraint("users_role_check", "users", "role IN ('student', 'admin')", schema="public")


def downgrade() -> None:
    op.drop_constraint("users_role_check", "users", schema="public", type_="check")
    op.execute("UPDATE public.users SET role = 'ADMIN' WHERE role = 'admin'")
    op.execute("UPDATE public.users SET role = 'USER' WHERE role = 'student'")
    op.alter_column(
        "users",
        "role",
        schema="public",
        existing_type=sa.String(length=20),
        server_default="USER",
    )
    op.create_check_constraint("users_role_check", "users", "role IN ('USER', 'ADMIN', 'SUPER_ADMIN')", schema="public")
