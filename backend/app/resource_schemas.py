from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int; name: str; description: str | None = None; resource_type: str | None = None
    title: str | None = None; file_name: str | None = None; label: str | None = None
    course_code: str | None = None; course_name: str | None = None; level: str | None = None
    category: str | None = None; folder_path: str; mime_type: str | None = None; file_size: int | None = None
    storage_migrated_at: datetime | None = None
    academic_year: str | None = None; semester: str | None = None; lecturer: str | None = None; department: str | None = None
    download_available: bool; is_active: bool; is_missing: bool
    last_synced_at: datetime | None = None
    created_at: datetime; updated_at: datetime


class ResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10000)
    resource_type: str | None = Field(default=None, max_length=100)
    label: str | None = Field(default=None, max_length=100)
    course_code: str | None = Field(default=None, max_length=50)
    course_name: str | None = Field(default=None, max_length=255)
    level: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=100)
    lecturer: str | None = Field(default=None, max_length=255)
    semester: str | None = Field(default=None, max_length=50)
    academic_year: str | None = Field(default=None, max_length=50)
    department: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class ResourcePage(BaseModel):
    items: list[ResourceOut]; page: int; page_size: int; total: int; total_pages: int


class FolderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None = None
    folder_path: str
    parent_folder_path: str | None = None
    level: str | None = None
    is_active: bool
    last_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class StorageIndexSummary(BaseModel):
    success: bool
    objects_indexed: int
    new_resources: int
    updated_resources: int
    indexed_at: datetime
