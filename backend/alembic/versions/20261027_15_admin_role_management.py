"""add audited administrator role management

Revision ID: 20261027_15
Revises: 20261018_14
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261027_15"
down_revision = "20261018_14"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admin_role_audit",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("previous_role", sa.String(20), nullable=False),
        sa.Column("new_role", sa.String(20), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("previous_role IN ('student', 'admin')", name="admin_role_audit_previous_role_check"),
        sa.CheckConstraint("new_role IN ('student', 'admin')", name="admin_role_audit_new_role_check"),
    )
    op.create_index("ix_admin_role_audit_actor_user_id", "admin_role_audit", ["actor_user_id"])
    op.create_index("ix_admin_role_audit_target_user_id", "admin_role_audit", ["target_user_id"])
    op.execute("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE public.users FROM PUBLIC, anon, authenticated")
    op.execute("ALTER TABLE public.admin_role_audit ENABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON TABLE public.admin_role_audit FROM PUBLIC, anon, authenticated")


def downgrade() -> None:
    op.drop_table("admin_role_audit")
    op.execute("ALTER TABLE public.users DISABLE ROW LEVEL SECURITY")
