# Security Policy

## Reporting a vulnerability

Do not disclose a suspected vulnerability in a public issue, discussion, screenshot, or student channel. Send a private report to the verified institutional security or portal-support contact.

The repository does not currently define that reporting address. The project owner must configure and publish a monitored private reporting channel before production launch. A useful report includes the affected route or component, prerequisites, impact, and a minimal reproduction without including real student data or credentials.

## Supported version

Security fixes are applied to the currently deployed Chemistry Hub release. Experimental prototypes under `experimentals/` are not production applications and should not be deployed.

## Architecture overview

- Firebase authenticates users and issues short-lived ID tokens.
- FastAPI verifies tokens and loads the user's database-backed role.
- Production account provisioning is restricted by configured email domains and/or explicit email exceptions and fails closed when no policy is configured.
- Students receive authenticated read access and a narrowly allowlisted profile update.
- Administrative directory and announcement writes require server-side admin authorization.
- SQLAlchemy uses parameterized database queries.
- Supabase PostgreSQL and Storage credentials remain server-side.
- Vercel and the API apply security headers; sensitive API responses use `Cache-Control: no-store`.

Frontend role checks are not a security boundary. Never weaken or remove backend dependencies from protected routes merely because the UI hides an action.

## Secrets policy

Never commit database URLs, Firebase Admin credentials, Supabase service-role keys, private keys, tokens, or populated `.env` files. Frontend `VITE_*` values are browser-visible and must never contain server secrets. Use provider-managed encrypted environment variables and rotate any credential that has entered source control or an untrusted log, even if it is later deleted.

## Dependency and release hygiene

Before a release:

```text
backend/.venv/bin/pytest -q
backend/.venv/bin/pip-audit -r backend/requirements.txt
cd frontend2 && npm ci && npm run build && npm audit --omit=dev
```

Review security updates individually. Avoid unattended major upgrades; verify authentication, routing, CSP, API authorization, directory CRUD, and uploads after dependency changes.
