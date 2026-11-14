# AI Agent Guide

## Project overview

Chemistry Hub is a department portal for students, staff, and administrators. Its active application is a React/Vite single-page client backed by FastAPI, Firebase Authentication, SQLAlchemy, and PostgreSQL. Supabase Storage serves directory media and academic resources. This repository also contains prototypes under `experimentals/`; those are not the production application.

## Technology and architecture

- Frontend: React 18, Vite, React Router, Tailwind CSS, Firebase client SDK.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic, Firebase Admin SDK.
- Data: PostgreSQL in production; development configuration can use SQLite.
- Integrations: Supabase Storage, VAPID/Web Push, Render API hosting, Vercel frontend hosting.
- Authentication: Firebase ID bearer tokens. The backend verifies tokens and loads the database-backed role; UI route guards are not authorization.

Use [ARCHITECTURE.md](ARCHITECTURE.md) for request/data flows and [PROJECT_MAP.md](PROJECT_MAP.md) to find implementation entry points.

## Required AI workflow

1. Read `AGENTS.md` before starting a task.
2. Consult only the relevant supporting documentation: `PROJECT_MAP.md`, `ARCHITECTURE.md`, `API_REFERENCE.md`, `DATABASE_SCHEMA.md`, `DECISIONS.md`, or `TASK_TRACKER.md`.
3. Inspect the existing implementation of the requested behavior before changing it.
4. Search the relevant subsystem for reusable functionality before introducing a new helper, route, table, service, or component.
5. Avoid unnecessary repository-wide exploration. Follow the relevant paths in `PROJECT_MAP.md` and expand the search only when evidence requires it.
6. Make minimal, targeted modifications.
7. Never rewrite unrelated working functionality.
8. Do not change established architecture without a concrete justification and approval when the change materially affects security, data, deployment, or user behavior.
9. Run the smallest relevant tests after implementation; run broader checks when the change crosses subsystems.
10. Update documentation whenever architecture, API contracts, database schema, deployment behavior, or feature status changes.

## Existing systems to reuse

- API requests: `frontend2/client.js`; endpoint strings: `frontend2/endpoints.js`.
- Firebase session and profile synchronization: `frontend2/AuthContext.jsx`, `backend/app/firebase.py`, `backend/app/security.py`, and `backend/app/routers/auth.py`.
- Backend database sessions and engine: `backend/app/database.py`; ORM metadata: `backend/app/models.py` and the domain model modules.
- Backend authorization: dependencies in `backend/app/security.py`; do not rely on frontend role checks.
- Feature APIs: existing routers in `backend/app/routers/`; schemas alongside them under `backend/app/`.
- Schema changes: Alembic migrations under `backend/alembic/versions/`. Do not use `Base.metadata.create_all()` for application schema management.
- Shared UI state and feedback: existing React context/providers and components; inspect `frontend2/App.jsx`, `frontend2/PortalLayout.jsx`, and nearby feature components before adding alternatives.

Do not create a second API client, Firebase token store, role system, database session helper, duplicate endpoint family, equivalent database table, or parallel component when an existing system already owns that responsibility. The two privacy route prefixes are a known existing compatibility case; do not add a third.

## Coding and data safety constraints

- Keep Firebase Admin credentials, database connection strings, Supabase service-role credentials, VAPID private keys, and populated environment files out of source control and documentation. `VITE_*` settings are browser-visible and must never contain server secrets.
- Treat the database role as the authorization source of truth. Do not accept roles, ownership IDs, approver IDs, or other security-sensitive values from an untrusted request body when the server can derive them from the authenticated user.
- Preserve ownership filters, role checks, transaction boundaries, RLS/grant behavior, private Storage rules, and security headers.
- Use the existing SQLAlchemy models and migrations; do not hand-edit a deployed schema or invent a parallel data store.
- Keep `experimentals/` as reference/prototype material unless a task explicitly targets it.
- Do not change production environment values, access policy, storage visibility, authentication policy, or migration history casually. Explain operational impact and obtain approval for consequential behavior changes.
- Preserve unrelated working-tree changes. Never reset, discard, or overwrite work that was not created for the current task.

## Development and verification

Run backend commands from `backend/` so `app` resolves:

```powershell
python -m pytest -q
```

Only apply `python -m alembic upgrade head` to the explicitly intended local/staging environment with a trusted database identity. Do not run a schema migration against production unless the task specifically authorizes it and the target has been confirmed.

Run frontend commands from `frontend2/`:

```powershell
npm test
npm run build
```

There is no configured frontend lint, type-check, or browser end-to-end script. Do not claim those checks ran unless a tool is added and executed. The backend suite is sensitive to `CORS_ORIGINS`; test with the origin values expected by `backend/tests/test_cors.py` when the shell environment overrides them.

## Documentation maintenance

- Keep endpoint paths, auth requirements, request/response model names, migrations, and deployment facts aligned with source.
- Mark uncertain deployment state, historical intent, and unverified live-database facts explicitly; do not convert guesses into requirements.
- Update `TASK_TRACKER.md` only from verified implementation or explicit project decisions.
- Keep detailed API and schema inventories in `API_REFERENCE.md` and `DATABASE_SCHEMA.md`; link to them rather than duplicating their contents here.
- Record only verified historical changes in `CHANGELOG.md`. If historical evidence is insufficient, retain a dated documentation baseline rather than inventing a timeline.


# MANDATORY DOCUMENTATION MAINTENANCE

These rules apply to EVERY development task, including bug fixes, new features, API changes, database changes, refactoring and configuration changes.

Documentation is part of implementation, not an optional final step.

## 1. Before Every Task

Before modifying code:

1. Read AGENTS.md.
2. Read the relevant project documentation.
3. Check TASK_TRACKER.md for current progress.
4. Inspect existing implementations before making changes.
5. Identify which documentation files will be affected.

Do not unnecessarily read every documentation file. Only inspect relevant sections.

## 2. API Documentation

Whenever an API is created, modified, renamed or removed:

- Update API_REFERENCE.md.
- Record the HTTP method and endpoint.
- Document request parameters and body.
- Document response structures.
- Document authentication and authorization requirements.
- Record the frontend API helper, if applicable.
- Record the backend route, service and implementation files.
- Document relevant error responses.
- Ensure documentation reflects the actual implementation.

Never invent API endpoints or response fields.

## 3. Database Documentation

Whenever database-related changes occur:

- Update DATABASE_SCHEMA.md.
- Document new or modified tables and columns.
- Record relationships, constraints and indexes.
- Record migration identifiers.
- Update ARCHITECTURE.md if database architecture changes.

Never document a migration as applied unless its application has been verified.

## 4. Architecture Documentation

Update ARCHITECTURE.md whenever:
- A new service is introduced.
- Existing services change responsibilities.
- Authentication or authorization changes.
- Frontend/backend communication changes.
- External integrations are added or removed.
- Deployment architecture changes.

## 5. Project Progress

After every completed task:

Update TASK_TRACKER.md with:
- What was completed.
- What remains.
- Bugs discovered.
- Tests performed and their results.
- Files created, modified or removed.
- Outstanding issues.

Only mark a feature completed after implementation and relevant verification.

## 6. Changelog

Update CHANGELOG.md for significant changes.

Include:
- Date.
- Feature or fix.
- Important files affected.
- Database migrations, where applicable.
- Relevant implementation notes.

Avoid documenting every trivial edit.

## 7. Decision Records

Update DECISIONS.md whenever an important architectural or technical decision is made.

Record why the decision was made and its implications.

## 8. Final Task Verification

Before declaring a task complete:

1. Verify implementation.
2. Run relevant tests.
3. Check whether API documentation needs updating.
4. Check whether database documentation needs updating.
5. Check whether architecture documentation needs updating.
6. Update TASK_TRACKER.md.
7. Update CHANGELOG.md when appropriate.
8. Report all documentation files updated.

If a documentation file does not need updating, do not modify it unnecessarily.

## 9. Important Restrictions

- Never overwrite accurate documentation with assumptions.
- Never invent implementation details.
- Never modify unrelated documentation.
- Never mark incomplete work as completed.
- Keep documentation synchronized with the actual codebase.
- Avoid repeatedly regenerating entire documentation files.

These requirements are mandatory for every development task.