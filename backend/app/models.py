import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('student', 'admin')", name="users_role_check"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    student_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    profile_photo_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_photo_mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student", server_default="student")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    @property
    def has_profile_photo(self) -> bool:
        return bool(self.profile_photo_path)


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    item_key: Mapped[str] = mapped_column(String(200), primary_key=True)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="Department")
    audience: Mapped[str] = mapped_column(String(50), nullable=False, default="All students")
    issuer: Mapped[str] = mapped_column(String(200), nullable=False, default="Chemistry Board of Studies")
    is_pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)


class ResourceFolder(Base):
    __tablename__ = "resource_folders"

    id: Mapped[int] = mapped_column(primary_key=True)
    google_drive_folder_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    parent_drive_folder_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    folder_path: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    # Drive-index fields below are additive aliases/metadata; ``name`` remains
    # the existing API display field used by the portal.
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Human-readable classification derived from a migrated bucket path.
    label: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    course_code: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    course_name: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    level: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    folder_path: Mapped[str] = mapped_column(Text, nullable=False)
    google_drive_file_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    google_drive_parent_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    mime_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    web_view_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    web_content_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    supabase_bucket: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supabase_storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    storage_migrated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    academic_year: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    lecturer: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    download_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true", index=True)
    is_missing: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)
    last_modified_drive: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
