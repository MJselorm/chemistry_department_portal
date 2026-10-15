from pathlib import Path


def test_runtime_backend_has_no_google_drive_integration():
    app_root = Path(__file__).resolve().parents[1] / "app"
    forbidden = ("google_drive", "googleapiclient", "drive.google.com")

    offenders = [
        path.relative_to(app_root).as_posix()
        for path in app_root.rglob("*.py")
        if any(value in path.read_text(encoding="utf-8").casefold() for value in forbidden)
    ]

    assert offenders == []
