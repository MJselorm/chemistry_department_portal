"""create users table

Revision ID: 20260917_01
Revises:
Create Date: 2026-09-17
"""

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260917_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if not context.is_offline_mode() and sa.inspect(bind).has_table("users", schema="public"):
        return

    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("firebase_uid", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=True),
        sa.Column("role", sa.String(length=20), server_default=sa.text("'USER'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.CheckConstraint("role IN ('USER', 'ADMIN', 'SUPER_ADMIN')", name="users_role_check"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("firebase_uid", name="uq_users_firebase_uid"),
        schema="public",
    )
    op.execute("""
        CREATE OR REPLACE FUNCTION public.set_users_updated_at()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          NEW.updated_at = timezone('utc', now());
          RETURN NEW;
        END;
        $$;
    """)
    op.execute("""
        CREATE TRIGGER users_set_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW EXECUTE FUNCTION public.set_users_updated_at();
    """)


def downgrade() -> None:
    bind = op.get_bind()
    if not context.is_offline_mode() and sa.inspect(bind).has_table("users", schema="public"):
        op.drop_table("users", schema="public")
    op.execute("DROP FUNCTION IF EXISTS public.set_users_updated_at()")
