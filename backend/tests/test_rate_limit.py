from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app import rate_limit


def _request(client="203.0.113.8", forwarded=None):
    headers = []
    if forwarded:
        headers.append((b"x-forwarded-for", forwarded.encode()))
    return Request({
        "type": "http",
        "method": "POST",
        "path": "/test",
        "headers": headers,
        "client": (client, 443),
        "server": ("testserver", 80),
        "scheme": "https",
    })


def test_forwarded_ip_is_used_only_for_a_trusted_proxy(monkeypatch):
    trusted = SimpleNamespace(trusted_proxy_networks=[])
    monkeypatch.setattr(rate_limit, "get_settings", lambda: trusted)
    assert rate_limit.client_ip(_request(forwarded="198.51.100.7")) == "203.0.113.8"

    trusted.trusted_proxy_networks = [rate_limit.ipaddress.ip_network("203.0.113.0/24")]
    assert rate_limit.client_ip(_request(forwarded="198.51.100.7, 203.0.113.8")) == "198.51.100.7"


def test_limit_exceeded_returns_429_and_retry_after(monkeypatch):
    settings = SimpleNamespace(rate_limit_enabled=True, trusted_proxy_networks=[])
    monkeypatch.setattr(rate_limit, "get_settings", lambda: settings)
    monkeypatch.setattr(rate_limit, "_consume_bucket", lambda *_args: (11, 42))

    with pytest.raises(HTTPException) as error:
        rate_limit.enforce_rate_limit(
            _request(),
            "role-request",
            "user-id",
            rate_limit.Limit(10, 3600),
            rate_limit.Limit(300, 3600),
        )

    assert error.value.status_code == 429
    assert error.value.headers["Retry-After"] == "42"
    assert "wait" in error.value.detail.lower()


def test_disabled_limit_does_not_touch_storage(monkeypatch):
    settings = SimpleNamespace(rate_limit_enabled=False, trusted_proxy_networks=[])
    monkeypatch.setattr(rate_limit, "get_settings", lambda: settings)
    monkeypatch.setattr(
        rate_limit,
        "_consume_bucket",
        lambda *_args: (_ for _ in ()).throw(AssertionError("storage should not be used")),
    )
    rate_limit.enforce_rate_limit(
        _request(),
        "mentorship-action",
        "user-id",
        rate_limit.Limit(60, 600),
        rate_limit.Limit(1000, 600),
    )
