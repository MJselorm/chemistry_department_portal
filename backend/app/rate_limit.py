"""Shared PostgreSQL-backed API rate limits for sensitive write operations."""

from __future__ import annotations

import hashlib
import ipaddress
import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .database import SessionLocal
from .models import User
from .security import current_firebase_claims, get_current_user

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Limit:
    requests: int
    window_seconds: int


def _trusted_proxy(peer: str | None) -> bool:
    if not peer:
        return False
    try:
        address = ipaddress.ip_address(peer)
    except ValueError:
        return False
    return any(address in network for network in get_settings().trusted_proxy_networks)


def client_ip(request: Request) -> str:
    """Use forwarded client IPs only when the direct peer is explicitly trusted."""
    peer = request.client.host if request.client else None
    if _trusted_proxy(peer):
        forwarded = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        try:
            return str(ipaddress.ip_address(forwarded))
        except ValueError:
            pass
    try:
        return str(ipaddress.ip_address(peer)) if peer else "unknown"
    except ValueError:
        return "unknown"


def _identifier_hash(scope: str, kind: str, value: str) -> str:
    return hashlib.sha256(f"{scope}:{kind}:{value}".encode()).hexdigest()


def _consume_bucket(scope: str, identifier_hash: str, rule: Limit) -> tuple[int, int]:
    now = datetime.now(timezone.utc)
    reset_before = now - timedelta(seconds=rule.window_seconds)
    statement = text("""
        INSERT INTO api_rate_limits
            (scope, identifier_hash, window_started_at, request_count, expires_at)
        VALUES
            (:scope, :identifier_hash, :now, 1, :expires_at)
        ON CONFLICT (scope, identifier_hash) DO UPDATE SET
            window_started_at = CASE
                WHEN api_rate_limits.window_started_at <= :reset_before THEN :now
                ELSE api_rate_limits.window_started_at
            END,
            request_count = CASE
                WHEN api_rate_limits.window_started_at <= :reset_before THEN 1
                ELSE api_rate_limits.request_count + 1
            END,
            expires_at = :expires_at
        RETURNING request_count, window_started_at
    """)
    with SessionLocal() as session:
        session.execute(text("DELETE FROM api_rate_limits WHERE expires_at < :now"), {"now": now})
        row = session.execute(statement, {
            "scope": scope,
            "identifier_hash": identifier_hash,
            "now": now,
            "reset_before": reset_before,
            "expires_at": now + timedelta(seconds=rule.window_seconds * 2),
        }).one()
        session.commit()
    elapsed = max(0, (now - row.window_started_at).total_seconds())
    retry_after = max(1, math.ceil(rule.window_seconds - elapsed))
    return int(row.request_count), retry_after


def enforce_rate_limit(
    request: Request,
    scope: str,
    user_identifier: str,
    user_limit: Limit,
    ip_limit: Limit,
) -> None:
    settings = get_settings()
    if not settings.rate_limit_enabled:
        return

    buckets = (
        ("user", user_identifier, user_limit),
        ("ip", client_ip(request), ip_limit),
    )
    for kind, value, rule in buckets:
        try:
            count, retry_after = _consume_bucket(
                f"{scope}:{kind}",
                _identifier_hash(scope, kind, value),
                rule,
            )
        except SQLAlchemyError:
            logger.exception("Rate-limit storage failed for scope %s", scope)
            return
        if count > rule.requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait and try again.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(rule.requests),
                },
            )


class UserRateLimit:
    def __init__(self, scope: str, user_limit: Limit, ip_limit: Limit):
        self.scope = scope
        self.user_limit = user_limit
        self.ip_limit = ip_limit

    def __call__(
        self,
        request: Request,
        user: Annotated[User, Depends(get_current_user)],
    ) -> None:
        enforce_rate_limit(request, self.scope, str(user.id), self.user_limit, self.ip_limit)


class FirebaseRateLimit:
    def __init__(self, scope: str, user_limit: Limit, ip_limit: Limit):
        self.scope = scope
        self.user_limit = user_limit
        self.ip_limit = ip_limit

    def __call__(
        self,
        request: Request,
        claims: Annotated[dict, Depends(current_firebase_claims)],
    ) -> None:
        enforce_rate_limit(request, self.scope, claims["uid"], self.user_limit, self.ip_limit)


AUTH_SYNC_LIMIT = FirebaseRateLimit("auth-sync", Limit(20, 600), Limit(300, 600))
ROLE_REQUEST_LIMIT = UserRateLimit("role-request", Limit(10, 3600), Limit(300, 3600))
ROLE_DECISION_LIMIT = UserRateLimit("role-decision", Limit(20, 600), Limit(500, 600))
MENTORSHIP_APPLICATION_LIMIT = UserRateLimit("mentorship-application", Limit(10, 3600), Limit(500, 3600))
MENTORSHIP_ACTION_LIMIT = UserRateLimit("mentorship-action", Limit(60, 600), Limit(1000, 600))
UPLOAD_LIMIT = UserRateLimit("file-upload", Limit(20, 3600), Limit(500, 3600))
STORAGE_INDEX_LIMIT = UserRateLimit("storage-index", Limit(5, 3600), Limit(100, 3600))
