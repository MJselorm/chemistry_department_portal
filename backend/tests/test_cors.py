from fastapi.testclient import TestClient

from app.main import app


def test_cors_allows_configured_origin_only():
    client = TestClient(app)
    allowed = client.options("/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    untrusted = client.options("/health", headers={"Origin": "https://attacker.vercel.app", "Access-Control-Request-Method": "GET"})

    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in untrusted.headers
