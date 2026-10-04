from app.services.test_drive_migration import _safe_segment


def test_storage_segment_preserves_a_safe_folder_name():
    assert _safe_segment("Level 100") == "Level 100"


def test_storage_segment_cannot_escape_its_prefix():
    assert _safe_segment("../notes.pdf") == "_notes.pdf"
