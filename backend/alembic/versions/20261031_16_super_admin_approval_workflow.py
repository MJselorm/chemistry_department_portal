"""add Super Admin role and approval workflow for administrator changes

Revision ID: 20261031_16
Revises: 20261027_15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261031_16"
down_revision = "20261027_15"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("users_role_check", "users", schema="public", type_="check")
    op.create_check_constraint(
        "users_role_check",
        "users",
        "role IN ('student', 'admin', 'super_admin')",
        schema="public",
    )
    op.create_table(
        "admin_role_change_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "requester_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "target_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "approver_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
        ),
        sa.Column("previous_role", sa.String(20), nullable=False),
        sa.Column("requested_role", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("resolution_note", sa.String(500)),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint(
            "previous_role IN ('student', 'admin')",
            name="admin_role_request_previous_role_check",
        ),
        sa.CheckConstraint(
            "requested_role IN ('student', 'admin')",
            name="admin_role_request_requested_role_check",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="admin_role_request_status_check",
        ),
    )
    op.create_index(
        "uq_admin_role_request_pending_target",
        "admin_role_change_requests",
        ["target_user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.create_index(
        "ix_admin_role_change_requests_requester_user_id",
        "admin_role_change_requests",
        ["requester_user_id"],
    )
    op.create_index(
        "ix_admin_role_change_requests_approver_user_id",
        "admin_role_change_requests",
        ["approver_user_id"],
    )
    op.add_column(
        "admin_role_audit",
        sa.Column(
            "request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("admin_role_change_requests.id", ondelete="RESTRICT"),
            nullable=True,
        ),
    )
    op.create_index("ix_admin_role_audit_request_id", "admin_role_audit", ["request_id"])
    op.execute("ALTER TABLE public.admin_role_change_requests ENABLE ROW LEVEL SECURITY")
    op.execute(
        "REVOKE ALL ON TABLE public.admin_role_change_requests "
        "FROM PUBLIC, anon, authenticated"
    )


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM public.users WHERE role = 'super_admin') THEN
            RAISE EXCEPTION 'Cannot remove Super Admin support while Super Admin accounts exist';
          END IF;
        END $$;
    """)
    op.drop_index("ix_admin_role_audit_request_id", table_name="admin_role_audit")
    op.drop_column("admin_role_audit", "request_id")
    op.drop_table("admin_role_change_requests")
    op.drop_constraint("users_role_check", "users", schema="public", type_="check")
    op.create_check_constraint(
        "users_role_check",
        "users",
        "role IN ('student', 'admin')",
        schema="public",
    )
