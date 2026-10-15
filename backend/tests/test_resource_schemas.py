from datetime import datetime, timezone
from app.resource_schemas import FolderOut, ResourceUpdate


def test_folder_out_schema():
    now = datetime.now(timezone.utc)
    folder = FolderOut(
        id=1,
        name="Level 200",
        folder_path="Academic Resources/Level 200",
        parent_folder_path="Academic Resources",
        level="200",
        is_active=True,
        last_synced_at=now,
        created_at=now,
        updated_at=now,
    )
    assert folder.id == 1
    assert folder.name == "Level 200"
    assert folder.level == "200"
    assert folder.parent_folder_path == "Academic Resources"


def test_resource_update_partial():
    update = ResourceUpdate(name="CHEM 212 Lecture 1", is_active=False)
    dump = update.model_dump(exclude_unset=True)
    assert dump == {"name": "CHEM 212 Lecture 1", "is_active": False}
