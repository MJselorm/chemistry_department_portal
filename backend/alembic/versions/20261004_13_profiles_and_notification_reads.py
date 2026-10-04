"""add profile fields and notification read state

Revision ID: 20261004_13
Revises: 20261004_12
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20261004_13"
down_revision = "20261004_12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("student_id", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("level", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("profile_photo_path", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("profile_photo_mime_type", sa.String(length=100), nullable=True))
    op.create_table(
        "notification_reads",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_key", sa.String(length=200), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "item_key"),
    )
    op.create_index("ix_notification_reads_user_id", "notification_reads", ["user_id"])
    op.execute("""
        DO $$
        DECLARE
            table_name text;
        BEGIN
            FOREACH table_name IN ARRAY ARRAY[
                'users', 'announcements', 'resource_folders', 'resources', 'events',
                'departments', 'executives', 'class_representatives', 'lecturers',
                'courses', 'course_representatives', 'lecturer_consultations',
                'clubs', 'committees', 'committee_members', 'department_contacts',
                'notification_reads'
            ] LOOP
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', table_name);
                END IF;
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', table_name);
                END IF;
            END LOOP;
        END $$;
    """)


def downgrade() -> None:
    op.drop_index("ix_notification_reads_user_id", table_name="notification_reads")
    op.drop_table("notification_reads")
    op.drop_column("users", "profile_photo_mime_type")
    op.drop_column("users", "profile_photo_path")
    op.drop_column("users", "level")
    op.drop_column("users", "student_id")
