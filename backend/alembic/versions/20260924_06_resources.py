"""add Google Drive academic resource index

Revision ID: 20260924_06
Revises: 20260923_05
Create Date: 2026-09-24
"""
from alembic import op
import sqlalchemy as sa

revision = "20260924_06"
down_revision = "20260923_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("resource_folders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("google_drive_folder_id", sa.String(255), nullable=False),
        sa.Column("parent_drive_folder_id", sa.String(255)), sa.Column("name", sa.String(500), nullable=False), sa.Column("description", sa.Text()),
        sa.Column("folder_path", sa.Text(), nullable=False), sa.Column("level", sa.String(50)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_synced_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("google_drive_folder_id", name="uq_resource_folders_drive_id"))
    op.create_index("ix_resource_folders_drive_id", "resource_folders", ["google_drive_folder_id"])
    op.create_table("resources",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(500), nullable=False), sa.Column("title", sa.String(500)), sa.Column("file_name", sa.String(500)), sa.Column("description", sa.Text()), sa.Column("resource_type", sa.String(100)), sa.Column("course_code", sa.String(50)), sa.Column("course_name", sa.String(255)), sa.Column("level", sa.String(50)), sa.Column("category", sa.String(100)), sa.Column("folder_path", sa.Text(), nullable=False), sa.Column("google_drive_file_id", sa.String(255), nullable=False), sa.Column("google_drive_parent_id", sa.String(255)), sa.Column("mime_type", sa.String(255)), sa.Column("file_size", sa.BigInteger()), sa.Column("web_view_link", sa.Text()), sa.Column("web_content_link", sa.Text()), sa.Column("academic_year", sa.String(50)), sa.Column("semester", sa.String(50)), sa.Column("lecturer", sa.String(255)), sa.Column("department", sa.String(255)), sa.Column("download_available", sa.Boolean(), nullable=False, server_default=sa.text("true")), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")), sa.Column("is_missing", sa.Boolean(), nullable=False, server_default=sa.text("false")), sa.Column("last_modified_drive", sa.DateTime(timezone=True)), sa.Column("last_synced_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()), sa.UniqueConstraint("google_drive_file_id", name="uq_resources_drive_file_id"))
    for column in ("name", "resource_type", "course_code", "course_name", "level", "category", "google_drive_file_id", "google_drive_parent_id", "academic_year", "semester", "lecturer", "department", "is_active", "is_missing"):
        op.create_index(f"ix_resources_{column}", "resources", [column])


def downgrade() -> None:
    op.drop_table("resources")
    op.drop_table("resource_folders")
