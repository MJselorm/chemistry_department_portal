from types import SimpleNamespace
from urllib.error import HTTPError

import pytest
from fastapi import HTTPException

from app import storage


def test_academic_object_url_encodes_special_object_path_characters(monkeypatch):
    monkeypatch.setattr(storage, "get_settings", lambda: SimpleNamespace(supabase_url="https://example.supabase.co"))

    url = storage.academic_object_url("academic-resources", "level 100/notes #1.pdf")

    assert url.endswith("/academic-resources/level%20100/notes%20%231.pdf")


def test_missing_academic_object_returns_a_helpful_not_found_error(monkeypatch):
    monkeypatch.setattr(
        storage,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://example.supabase.co",
            supabase_service_role_key="server-only-key",
        ),
    )

    def missing(*_args, **_kwargs):
        raise HTTPError("https://example.supabase.co/file", 404, "Not Found", None, None)

    monkeypatch.setattr(storage, "urlopen", missing)

    with pytest.raises(HTTPException) as exc_info:
        storage.academic_file_chunks("academic-resources", "level-100/missing.pdf")

    assert exc_info.value.status_code == 404
    assert "no longer available" in exc_info.value.detail
