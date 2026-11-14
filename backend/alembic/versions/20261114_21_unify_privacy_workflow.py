"""unify privacy request schemas

Revision ID: 20261114_21
Revises: 20261108_20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20261114_21"
down_revision = "20261108_20"
branch_labels = None
depends_on = None


def _index_names(table: str) -> set[str]:
    return {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}


def _ensure_index(table: str, name: str, columns: list[str]) -> None:
    if name not in _index_names(table):
        op.create_index(name, table, columns)


def _ensure_privacy_audit_tables() -> None:
    tables = set(sa.inspect(op.get_bind()).get_table_names())
    if "privacy_audit_events" not in tables:
        op.create_table(
            "privacy_audit_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("privacy_request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("privacy_requests.id", ondelete="RESTRICT"), nullable=True),
            sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
            sa.Column("event_type", sa.String(80), nullable=False),
            sa.Column("ip_hash", sa.String(64), nullable=True),
            sa.Column("detail", sa.String(200), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
    for name, columns in (
        ("ix_privacy_audit_events_request_id", ["privacy_request_id"]),
        ("ix_privacy_audit_events_actor_user_id", ["actor_user_id"]),
        ("ix_privacy_audit_events_event_type", ["event_type"]),
        ("ix_privacy_audit_events_created_at", ["created_at"]),
        ("ix_privacy_audit_events_actor_created_at", ["actor_user_id", "created_at"]),
    ):
        _ensure_index("privacy_audit_events", name, columns)

    tables = set(sa.inspect(op.get_bind()).get_table_names())
    if "privacy_rate_limits" not in tables:
        op.create_table(
            "privacy_rate_limits",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("scope", sa.String(130), nullable=False),
            sa.Column("action", sa.String(50), nullable=False),
            sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.UniqueConstraint("scope", "action", "window_started_at", name="uq_privacy_rate_limit_window"),
        )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "privacy_requests" not in inspector.get_table_names():
        raise RuntimeError("The privacy_requests table must exist before applying this migration.")

    columns = {column["name"]: column for column in inspector.get_columns("privacy_requests")}
    if "details" not in columns:
        op.add_column("privacy_requests", sa.Column("details", sa.Text(), nullable=True))
    if "requester_email" not in columns:
        op.add_column("privacy_requests", sa.Column("requester_email", sa.String(320), nullable=True))
        bind.execute(
            sa.text(
                "UPDATE privacy_requests AS request "
                "SET requester_email = users.email "
                "FROM users WHERE request.user_id = users.id"
            )
        )
    if "requester_name" not in columns:
        op.add_column("privacy_requests", sa.Column("requester_name", sa.String(200), nullable=True))
        bind.execute(
            sa.text(
                "UPDATE privacy_requests AS request "
                "SET requester_name = users.full_name "
                "FROM users WHERE request.user_id = users.id"
            )
        )
    if "reason" not in columns:
        op.add_column("privacy_requests", sa.Column("reason", sa.Text(), nullable=True))
    if "details" in columns:
        bind.execute(sa.text("UPDATE privacy_requests SET reason = details WHERE reason IS NULL"))
    if "resolved_by_id" not in columns:
        op.add_column("privacy_requests", sa.Column("resolved_by_id", postgresql.UUID(as_uuid=True), nullable=True))
        if "resolved_by" in columns:
            bind.execute(sa.text("UPDATE privacy_requests SET resolved_by_id = resolved_by WHERE resolved_by_id IS NULL"))
        op.create_foreign_key(
            "fk_privacy_requests_resolved_by_id_users",
            "privacy_requests",
            "users",
            ["resolved_by_id"],
            ["id"],
            ondelete="SET NULL",
        )

    missing_email = bind.execute(
        sa.text("SELECT count(*) FROM privacy_requests WHERE requester_email IS NULL")
    ).scalar_one()
    if missing_email:
        raise RuntimeError("Unable to preserve privacy requests without a linked user's email address.")
    op.alter_column(
        "privacy_requests",
        "requester_email",
        existing_type=sa.String(320),
        nullable=False,
    )

    inspector = sa.inspect(bind)
    user_id = next(column for column in inspector.get_columns("privacy_requests") if column["name"] == "user_id")
    if not user_id["nullable"]:
        op.alter_column("privacy_requests", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    user_fk = next(
        (
            foreign_key
            for foreign_key in inspector.get_foreign_keys("privacy_requests")
            if foreign_key["constrained_columns"] == ["user_id"]
        ),
        None,
    )
    if user_fk and user_fk.get("name") and user_fk.get("options", {}).get("ondelete", "").upper() != "SET NULL":
        op.drop_constraint(user_fk["name"], "privacy_requests", type_="foreignkey")
        user_fk = None
    if user_fk is None:
        op.create_foreign_key(
            "fk_privacy_requests_user_id_users",
            "privacy_requests",
            "users",
            ["user_id"],
            ["id"],
            ondelete="SET NULL",
        )

    check_names = {
        constraint["name"]
        for constraint in sa.inspect(bind).get_check_constraints("privacy_requests")
    }
    if "privacy_requests_status_check" in check_names:
        op.drop_constraint("privacy_requests_status_check", "privacy_requests", type_="check")
    op.create_check_constraint(
        "privacy_requests_status_check",
        "privacy_requests",
        "status IN ('pending', 'under_review', 'in_review', 'approved', 'completed', 'rejected', 'cancelled')",
    )

    indexes = _index_names("privacy_requests")
    for old_index in ("uq_privacy_requests_active_type", "uq_privacy_requests_active_deletion"):
        if old_index in indexes:
            op.drop_index(old_index, table_name="privacy_requests")
    for name, columns in (
        ("ix_privacy_requests_user_id", ["user_id"]),
        ("ix_privacy_requests_request_type", ["request_type"]),
        ("ix_privacy_requests_status", ["status"]),
        ("ix_privacy_requests_user_created_at", ["user_id", "created_at"]),
    ):
        _ensure_index("privacy_requests", name, columns)
    op.create_index(
        "uq_privacy_requests_active_type",
        "privacy_requests",
        ["user_id", "request_type"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'under_review', 'in_review')"),
    )

    _ensure_privacy_audit_tables()
    for table in ("privacy_requests", "privacy_audit_events", "privacy_rate_limits"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"REVOKE ALL ON TABLE {table} FROM anon, authenticated")


def downgrade() -> None:
    # Keep request and audit data intact when rolling back application code.
    pass
