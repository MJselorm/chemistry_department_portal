# GSCS-KNUST Academic Portal

A Chemistry Department portal for the Ghana Society of Chemical Sciences at KNUST. The active application pairs a React/Vite client with a FastAPI API, Firebase Authentication, and a Supabase-hosted PostgreSQL database.

## Project layout

| Path                                                  | Purpose                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `frontend2/`                                          | Active React 18 + Vite portal, including Firebase sign-in and member dashboard.          |
| `backend/`                                            | FastAPI service, Firebase token verification, SQLAlchemy models, and Alembic migrations. |
| `experimentals/frontend/`                             | Earlier static Firebase client.                                                          |
| `experimentals/dashboard/`                            | Dashboard UI prototype/reference components.                                             |
| `experimentals/chemistry_department_portal_frontend/` | Static HTML prototype screens.                                                           |
| `experimentals/figma/`                                | Design reference assets.                                                                 |

## Prerequisites

- Node.js 18 or later
- Python 3.10 or later
- A Firebase project with Email/Password sign-in enabled
- A Supabase PostgreSQL project

## Configure local environment

1. Create local environment files from the checked-in examples:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend2/.env.example frontend2/.env
   ```

2. In `backend/.env`, set `DATABASE_URL` to your Supabase connection string and configure one Firebase Admin credential option:
   - `FIREBASE_SERVICE_ACCOUNT_PATH` pointing to a local service-account JSON file, or
   - `FIREBASE_SERVICE_ACCOUNT_JSON` containing the credential JSON.

   Use the `postgresql+psycopg://` URL scheme and URL-encode special characters in the database password. Keep all credentials out of version control.

3. In `frontend2/.env`, set the `VITE_FIREBASE_*` values from the Firebase web app, set `VITE_API_BASE_URL` if the API is not at `http://127.0.0.1:8000`, and set `VITE_SUPPORT_EMAIL` to a verified institutional support address before production. Firebase web configuration is client-visible, but local environment files remain untracked to keep environments separate.

## Run locally

Start the API in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload
```

Start the portal in another terminal:

```powershell
cd frontend2
npm install
npm run dev
```

Open the URL Vite prints, normally `http://127.0.0.1:5173`.

## Deploy

Deploy `frontend2/` as a static Vite application and `backend/` as a Python/FastAPI service. Configure the values below in the hosting provider's encrypted environment-variable settings; never upload or commit a Firebase Admin service-account JSON file.

| Service         | Required production configuration                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Render backend  | Copy the keys in [`backend/.env.production.example`](backend/.env.production.example). Keep `APP_ENV=production` and set `CORS_ORIGINS` to exact trusted frontend origins only.         |
| Vercel frontend | Copy the keys in [`frontend2/.env.production.example`](frontend2/.env.production.example). Keep `VITE_API_BASE_URL=/api` and configure a verified `VITE_SUPPORT_EMAIL`.                  |

For the backend, create a Firebase service-account key in Firebase Console under **Project settings → Service accounts**, then store the complete JSON document as `FIREBASE_SERVICE_ACCOUNT_JSON`. `FIREBASE_SERVICE_ACCOUNT_PATH` is for local development only because a path on your computer is unavailable to the hosted service.

After changing frontend `VITE_*` variables, rebuild and redeploy the frontend; Vite embeds them at build time. After changing backend variables, redeploy or restart the API. A `503 Authentication verification is temporarily unavailable` response means the backend cannot initialize Firebase Admin, usually because `FIREBASE_SERVICE_ACCOUNT_JSON` is missing, malformed, or belongs to a different Firebase project.

## API overview

All endpoints except `GET /health` require `Authorization: Bearer <firebase_id_token>`.

- `GET /health` verifies that the API is running.
- `POST /auth/sync` creates or updates the Firebase-linked profile idempotently.
- `GET /users/me` reads the authenticated profile.
- `PATCH /users/me` updates the profile's `full_name`.
- `GET /admin/test` verifies the database-backed admin role check.
- `/api/directory/*` reads require an authenticated profile; writes require the database-backed `admin` role.
- `GET /announcements` requires an authenticated profile; announcement creation and deletion require `admin`.

## Security model

The browser authenticates with Firebase and sends a short-lived Firebase ID token to FastAPI in the `Authorization` header. The application keeps that API token in memory rather than copying it into `localStorage`. Firebase controls whether its own session is local or session-only through the **Keep me signed in** choice and refreshes ID tokens through `onIdTokenChanged`.

FastAPI verifies every ID token with Firebase Admin, including revocation checks, and looks up the corresponding application profile by verified Firebase UID. The database role is the authorization source of truth:

- `student`: may read authenticated portal content and update only their own allowlisted `full_name` field.
- `admin`: may perform directory and announcement administration.

React route guards are user-interface controls only. Admin API routes independently enforce `require_admin`. Roles are not accepted from profile or directory request bodies. Promote administrators only through a controlled database administration process with an audit trail.

Authentication uses bearer headers rather than cookies, so the API is not currently dependent on cookie-based CSRF protection. CORS is an additional browser control, not an authorization boundary. Production `CORS_ORIGINS` must contain exact origins and must never use arbitrary shared-hosting wildcards.

The backend connects directly to PostgreSQL and uses parameterized SQLAlchemy queries. Supabase service-role credentials are server-only and are used for directory image storage; they must never be exposed as `VITE_*` variables. Directory image objects are returned through a public bucket URL, so administrators must not upload confidential images.

## Production checklist

Before launch:

1. Set `APP_ENV=production`, exact `CORS_ORIGINS`, `DATABASE_URL`, Firebase Admin credentials, and Supabase Storage values in Render's encrypted environment settings.
2. Set all Firebase web values and a verified `VITE_SUPPORT_EMAIL` in Vercel. Confirm that the CSP in `frontend2/vercel.json` permits only services actually in use.
3. Configure Firebase authorized domains, password-reset templates, and provider-level abuse protections. Set `ALLOWED_EMAIL_DOMAINS` and/or `ALLOWED_USER_EMAILS` to the institution-approved account policy; production access fails closed when both are empty. Keep `REQUIRE_VERIFIED_EMAIL=true` unless the institution explicitly approves a different process.
4. Apply Alembic migrations using a restricted deployment identity. Use a least-privilege runtime database role where practical and confirm backups and restoration procedures.
5. Confirm the `directory-media` bucket's public-read requirement and retention policy. Do not upload sensitive documents through the image endpoint.
6. Configure platform/WAF rate limits for authentication, password reset, directory search, and uploads. The application does not include a distributed rate limiter.
7. Replace all mock/placeholder event, academic-resource, notification, and settings integrations or disable those controls before launch.
8. Review the Privacy Notice and Terms of Use with the responsible university/society representative. Confirm the public contact, retention schedule, age/audience policy, and asset/logo permissions.
9. Test sign-in, reset, logout, student/admin authorization, CRUD, uploads, CSP, and error handling against the actual production Firebase, database, storage, and domains.

Vercel supplies CSP, clickjacking, referrer, permissions, MIME-sniffing, and HSTS headers from `frontend2/vercel.json`. FastAPI adds API security headers and `Cache-Control: no-store` to authenticated or sensitive responses. Production API documentation is disabled when `APP_ENV=production`.

## Privacy and legal routes

- `/privacy` documents verified data processing, essential Firebase/browser storage, service providers, and account-data requests.
- `/terms` provides an operational acceptable-use baseline requiring institutional/legal review.
- No refund policy is included because the application does not process payments.
- No cookie-consent banner is included because no analytics, advertising, or other non-essential trackers were found. Reassess before adding such services.
- `robots.txt` and page metadata prevent this authenticated portal from being indexed; no sitemap is generated because there are no intended indexable routes.

The application processes account identifiers, email addresses, names, roles, directory contact/academic information, and administrator-provided profile images. The repository does not define a final retention schedule or automated account deletion. Requests must be identity-verified and handled by the responsible institution.

See [`SECURITY.md`](SECURITY.md) for vulnerability reporting and secrets guidance.

## Database migrations

Alembic owns backend schema changes. After modifying a SQLAlchemy model, generate, review, and apply a migration:

```powershell
cd backend
python -m alembic revision --autogenerate -m "describe the change"
python -m alembic upgrade head
```

Do not use `Base.metadata.create_all()` in the application.

## Development notes

`VITE_USE_MOCKS=true` lets the React dashboard display sample data if optional dashboard endpoints are unavailable. Set it to `false` when those API routes are implemented. See [`frontend2/README.md`](frontend2/README.md) for the expected response shapes and frontend architecture.

## Verification

Install backend test tooling and run the focused security suite:

```powershell
cd backend
pip install -r requirements-dev.txt
pytest -q
pip-audit -r requirements.txt
```

Build and audit production frontend dependencies:

```powershell
cd frontend2
npm ci
npm run build
npm audit --omit=dev
```

The repository currently has no frontend lint, typecheck, or automated browser-test scripts. Add those before expanding the frontend's production surface.

The current npm audit also reports a moderate React Router advisory whose published fix requires the major React Router 7 migration. This client is browser-rendered rather than SSR, and the only dynamic post-login destination is constrained to a local slash-prefixed path with backslashes and protocol-relative paths rejected. Plan and test the major router upgrade rather than applying it unattended.
