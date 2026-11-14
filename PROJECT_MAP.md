# Project Map

This map describes the active implementation and its main relationships. Read only the paths relevant to a task; `experimentals/` contains prototypes and is not the deployed application.

## Repository root

| Path | Responsibility |
|---|---|
| `main.py` | Compatibility ASGI entry point; adds `backend/` to `sys.path` and exports `app.main:app`. |
| `render.yaml` | Render backend service settings and production environment-variable declarations. Values are references/placeholders, not credentials. |
| `README.md` | Setup, deployment, security, operations, and feature overview. Some older endpoint summaries may lag the source. |
| `SECURITY.md` | Vulnerability reporting guidance, security posture, and release hygiene. Reporting contact is not configured in the repository. |
| `AGENTS.md` | Required AI development workflow and guardrails. |
| `ARCHITECTURE.md` | System architecture and cross-component data flow. |
| `API_REFERENCE.md` | Verified backend endpoints, access requirements, request and response models, and frontend callers. |
| `DATABASE_SCHEMA.md` | ORM tables, relationships, constraints, and Alembic history. |
| `DECISIONS.md` | Active architectural choices evidenced by source; historical rationale is marked where unknown. |
| `TASK_TRACKER.md` | Verified implementation status, operational follow-ups, known issues, and test status. |
| `CHANGELOG.md` | Documentation-baseline entry; no unverified project history is inferred. |

## Active frontend: `frontend2/`

The React/Vite application is organized directly under this directory rather than under `src/`.

| Path | Responsibility and relationships |
|---|---|
| `App.jsx`, `main.jsx` | Router, lazy page loading, providers, error boundary, and SPA bootstrap. |
| `AuthContext.jsx`, `firebase.js`, `ProtectedRoute.jsx` | Firebase session, token/profile synchronization, MFA flows, and client-side route gating. Backend authorization remains authoritative. |
| `client.js`, `endpoints.js`, `vite.config.js` | Bearer-token HTTP client, endpoint constants, timeout/retry behavior, and development proxy. Feature pages call through these shared helpers. |
| `PortalLayout.jsx`, `Sidebar.jsx`, `Topbar.jsx` | Shared authenticated portal shell and navigation. |
| `*Page.jsx` files | Feature pages: dashboard, events, academic resources, directory, announcements, profile, settings, legal, and mentorship. |
| `directory/` | Directory administration and consultation/member UI composed by directory pages. |
| `AdminPage.jsx` and `Admin*` panels | Admin management, notifications, privacy requests, and mentorship operations. |
| `useApi.js` | Feature-level API/query helper and optional mock fallback; inspect before introducing another hook/helper. |
| `filePreview.js`, `ResourceThumbnail.jsx`, `SafeImage.jsx`, viewer components | Validated local document preview and image/document display. Unsupported formats are not rendered. |
| `public/sw.js`, `pushNotifications.js` | Browser service worker and Web Push subscription interaction. |
| `vercel.json` | SPA rewrite and browser security headers. |
| `tests/` | Node tests for consent preferences, file previews, and safe URLs. |
| `.env.example`, `.env.production.example` | Frontend configuration names; do not copy secret values into docs or source. |

For frontend work, start with the page/component, `endpoints.js`, and `client.js`; inspect `AuthContext.jsx` if the change touches identity or roles.

## Active backend: `backend/`

| Path | Responsibility and relationships |
|---|---|
| `app/main.py` | FastAPI app, CORS middleware, router registration, generic exception handler, and `/health`. |
| `app/config.py`, `app/database.py` | Settings validation, engine creation, and SQLAlchemy session dependency. |
| `app/firebase.py`, `app/security.py` | Firebase Admin token verification and authenticated-user/admin/MFA dependencies. |
| `app/routers/` | HTTP handlers grouped by auth, users, admin, announcements, directory, resources, events, notifications, privacy, and mentorship. |
| `app/*_schemas.py`, `app/schemas.py` | Pydantic request/response schemas used by routers. |
| `app/models.py`, `app/event_models.py`, `app/directory_models.py`, `app/mentorship_models.py` | SQLAlchemy metadata grouped by domain. Alembic imports these modules to register tables. |
| `app/services/` | Domain logic, including privacy request/export/rate-limit helpers and mentorship scoring/workflow. Routers use these services rather than duplicating core logic. |
| `app/storage.py` | Supabase Storage operations for directory media and academic resources. |
| `app/` other modules | Feature-specific utilities, including notification delivery and resource indexing/streaming; follow imports from the affected router. |
| `alembic/versions/` | Ordered schema history; `alembic/env.py` registers model metadata. |
| `requirements.txt`, `requirements-dev.txt` | Runtime and test dependencies. |
| `.env.example`, `.env.production.example` | Backend configuration names for local and hosted deployment. |
| `PRIVACY_REQUESTS.md`, `EVENTS.md` | Focused operational documentation; compare them with current routers because portions predate current routes/roles. |
| `tests/` | Pytest suite for routers, schemas, storage, notifications, privacy, admin, mentorship, and other backend behavior. |

For API work, inspect the matching router and schema, then its service/model and tests. For data work, inspect the ORM model and relevant Alembic revision before making a change.

## Prototypes and references: `experimentals/`

- `experimentals/frontend/`: earlier static Firebase client.
- `experimentals/dashboard/`: dashboard prototype/reference components.
- `experimentals/chemistry_department_portal_frontend/`: static HTML prototype screens and structure documentation.
- `experimentals/figma/`: design reference asset(s).

Do not treat these as active routes or production implementation without an explicit task to migrate or reuse them.

## Where to start by task

| Task | First files/docs to inspect |
|---|---|
| New/changed API | `API_REFERENCE.md`, `backend/app/routers/<feature>.py`, matching schema, service, tests, and `frontend2/endpoints.js` if called by the client. |
| Authentication/authorization | `ARCHITECTURE.md`, `backend/app/security.py`, `backend/app/firebase.py`, `frontend2/AuthContext.jsx`, relevant auth tests. |
| Database change | `DATABASE_SCHEMA.md`, relevant ORM module, `backend/alembic/versions/`, migration tests or model imports. |
| Frontend page/component | `frontend2/App.jsx`, target page/component, `client.js`, `endpoints.js`, related tests. |
| Storage/document preview | `backend/app/storage.py`, resource router/service, `frontend2/filePreview.js` and viewer components. |
| Deploy/configuration | `README.md`, `render.yaml`, `frontend2/vercel.json`, environment examples, and the relevant config code. |
| Notifications/push | Notification router/service/models plus `frontend2/NotificationCenter.jsx`, `pushNotifications.js`, and service worker. |
