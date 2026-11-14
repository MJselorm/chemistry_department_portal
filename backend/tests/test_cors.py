from fastapi.testclient import TestClient

from app import main as main_module
from app.main import app


def test_cors_allows_configured_origin_only():
    client = TestClient(app)
    allowed = client.options("/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    untrusted = client.options("/health", headers={"Origin": "https://attacker.vercel.app", "Access-Control-Request-Method": "GET"})

    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-origin" not in untrusted.headers


def test_health_reports_database_connectivity(monkeypatch):
    class _Connection:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def execute(self, _statement):
            return None

    monkeypatch.setattr(main_module.engine, "connect", lambda: _Connection())
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_health_reports_database_failure(monkeypatch):
    def fail_connect():
        raise OSError("database unavailable")

    monkeypatch.setattr(main_module.engine, "connect", fail_connect)
    response = TestClient(app).get("/health")

    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "error"}
