from datetime import datetime, timezone
from app.resource_schemas import ResourceOut, ResourceUpdate, FolderOut, SyncSummary


def test_folder_out_schema():
    now = datetime.now(timezone.utc)
    folder = FolderOut(
        id=1,
        google_drive_folder_id="drive_folder_123",
        name="Level 200",
        folder_path="Academic Resources/Level 200",
        level="200",
        is_active=True,
        last_synced_at=now,
        created_at=now,
        updated_at=now,
    )
    assert folder.id == 1
    assert folder.name == "Level 200"
    assert folder.level == "200"


def test_resource_update_partial():
    update = ResourceUpdate(name="CHEM 212 Lecture 1", is_active=False)
    dump = update.model_dump(exclude_unset=True)
    assert dump == {"name": "CHEM 212 Lecture 1", "is_active": False}


def test_sync_summary_schema():
    now = datetime.now(timezone.utc)
    summary = SyncSummary(
        success=True,
        folders_scanned=5,
        files_scanned=20,
        new_resources=3,
        updated_resources=2,
        unchanged_resources=15,
        missing_resources=0,
        sync_completed_at=now,
    )
    assert summary.success is True
    assert summary.files_scanned == 20
    assert summary.new_resources == 3
