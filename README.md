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
- Supabase Storage with the existing private `academic-resources` bucket

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

   To enable Academic Resources, configure `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ACADEMIC_STORAGE_BUCKET`
   (normally `academic-resources`). The service-role key is server-only; the
   browser previews files through authenticated API streaming endpoints and
   receives short-lived signed Storage URLs for downloads and lazy card
   thumbnails. Keep the bucket private.

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
| Vercel frontend | Copy the keys in [`frontend2/.env.production.example`](frontend2/.env.production.example). Set `VITE_API_BASE_URL` to the HTTPS Render API origin and configure a verified `VITE_SUPPORT_EMAIL`. |

For the backend, create a Firebase service-account key in Firebase Console under **Project settings → Service accounts**, then store the complete JSON document as `FIREBASE_SERVICE_ACCOUNT_JSON`. `FIREBASE_SERVICE_ACCOUNT_PATH` is for local development only because a path on your computer is unavailable to the hosted service.

After changing frontend `VITE_*` variables, rebuild and redeploy the frontend; Vite embeds them at build time. After changing backend variables, redeploy or restart the API. A `503 Authentication verification is temporarily unavailable` response means the backend cannot initialize Firebase Admin, usually because `FIREBASE_SERVICE_ACCOUNT_JSON` is missing, malformed, or belongs to a different Firebase project.

## API overview

All endpoints except `GET /health` require `Authorization: Bearer <firebase_id_token>`.

- `GET /health` verifies that the API is running.
- `POST /auth/sync` creates or updates the Firebase-linked profile idempotently.
- `GET /users/me` reads the authenticated profile.
- `PATCH /users/me` updates the profile's `full_name`.
- `GET /admin/test` verifies the database-backed admin role check.
- `GET /admin/users` lists portal accounts for administrators only.
- `/api/resources/*` provides authenticated academic-resource browsing,
  preview, short-lived thumbnail links, and download links; indexing, uploads,
  metadata updates, and removal require an admin.
- `/api/events/*` provides published-event viewing; event administration
  requires an admin.
- `/api/directory/*` reads require an authenticated profile; writes require the database-backed `admin` role.
- `GET /announcements` requires an authenticated profile; announcement creation and deletion require `admin`.
- `/api/notifications/*` provides user-scoped notification history, read state,
  unread counts, and push subscriptions. `/api/notifications/admin/*` requires
  the database-backed `admin` role.
- `/api/privacy/requests/me` returns only the authenticated user's request
  history. `/api/privacy/requests/export` creates an audit record and returns an
  ownership-scoped JSON export. `/api/privacy/requests/deletion` creates one
  active reviewed deletion request per user. `/api/privacy/admin/*` requires an
  administrator and updates workflow status only; it never automatically
  deletes accounts or shared academic resources.

## Security model

The browser authenticates with Firebase and sends a short-lived Firebase ID token to FastAPI in the `Authorization` header. The application keeps that API token in memory rather than copying it into `localStorage`. Firebase controls whether its own session is local or session-only through the **Keep me signed in** choice and refreshes ID tokens through `onIdTokenChanged`.

FastAPI verifies every ID token with Firebase Admin, including revocation checks, and looks up the corresponding application profile by verified Firebase UID. The database role is the authorization source of truth:

- `student`: may read authenticated portal content and update only their own allowlisted `full_name` field.
- `admin`: may perform directory and announcement administration.

React route guards are user-interface controls only. Admin API routes independently enforce `require_admin`. Roles are not accepted from profile or directory request bodies. Promote administrators only through a controlled database administration process with an audit trail.

Authentication uses bearer headers rather than cookies, so the API is not currently dependent on cookie-based CSRF protection. CORS is an additional browser control, not an authorization boundary. Production `CORS_ORIGINS` must contain exact origins and must never use arbitrary shared-hosting wildcards.

The backend connects directly to PostgreSQL and uses parameterized SQLAlchemy queries. Supabase service-role credentials are server-only and are used for directory image storage, authenticated Academic Storage previews, and short-lived URL signing; they must never be exposed as `VITE_*` variables. Directory image objects are returned through a public bucket URL, so administrators must not upload confidential images. Academic resource objects remain in a private bucket. Preview-link requests require Firebase authentication and expire after five minutes; download links expire after 60 seconds.

## Production checklist

Before launch:

1. Set `APP_ENV=production`, exact `CORS_ORIGINS`, `DATABASE_URL`, Firebase Admin credentials, and Supabase Storage values in Render's encrypted environment settings.
2. Set all Firebase web values and a verified `VITE_SUPPORT_EMAIL` in Vercel. Confirm that the CSP in `frontend2/vercel.json` permits only services actually in use.
3. Configure Firebase authorized domains, password-reset templates, and provider-level abuse protections. Set `ALLOWED_EMAIL_DOMAINS` and/or `ALLOWED_USER_EMAILS` to the institution-approved account policy; production access fails closed when both are empty. Keep `REQUIRE_VERIFIED_EMAIL=true` unless the institution explicitly approves a different process.
4. Apply Alembic migrations using a restricted deployment identity. Use a least-privilege runtime database role where practical and confirm backups and restoration procedures.
5. Confirm the `directory-media` bucket's public-read requirement and retention policy. Keep `academic-resources` private and allow the service-role key to read and write it; do not upload sensitive documents through the image endpoint.
6. Configure platform/WAF rate limits for authentication, password reset, directory search, and uploads. The application does not include a distributed rate limiter.
7. Confirm that every enabled event, profile, notification, and settings control is backed by the deployed API; unsupported controls remain removed.
8. Review the Privacy Notice and Terms of Use with the responsible university/society representative. Confirm the public contact, retention schedule, age/audience policy, and asset/logo permissions.
9. Test sign-in, reset, logout, student/admin authorization, CRUD, uploads, CSP, and error handling against the actual production Firebase, database, storage, and domains.
10. Apply migrations through `20261018_14`, generate one VAPID key pair, and configure
    `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in Render. The
    private key must never be added to Vercel or any `VITE_*` variable.

Vercel supplies CSP, clickjacking, referrer, permissions, MIME-sniffing, and HSTS headers from `frontend2/vercel.json`. Academic preview streams and signed-link responses use `Cache-Control: private, no-store`.

## Privacy and legal routes

- `/privacy` documents verified data processing, essential Firebase/browser storage, service providers, and account-data requests.
- `/terms` provides an operational acceptable-use baseline requiring institutional/legal review.
- `/cookies` documents essential authentication storage and optional local theme/sidebar preferences.
- No refund policy is included because the application does not process payments.
- A first-visit preference banner gates optional local theme/sidebar storage.
  Analytics and advertising trackers are not initialized. The stored consent
  record is essential so the choice is respected on later visits.
- `robots.txt` and page metadata prevent this authenticated portal from being indexed; no sitemap is generated because there are no intended indexable routes.

The application processes account identifiers, email addresses, names, roles, directory contact/academic information, administrator-provided profile images, notification state, and tracked privacy requests. The repository does not define a final institution-approved retention schedule or automated account deletion. Deletion requests remain pending until identity-verified administrative review is completed.

## Notifications and Web Push

Published announcements transactionally create one idempotent in-app
notification. Administrators can also publish or schedule standalone notices for
all students or one existing student email. Users can read, dismiss, or mark all
notices read; each browser subscription is bound to its authenticated owner.

Push permission is requested only from the explicit Settings action. The service
worker displays a minimal lock-screen message and opens a validated local portal
path. Push-service acceptance is recorded separately from in-app reads. Failed or
expired push subscriptions never remove the persistent in-app notification.
Subscription endpoints are limited to the supported Chrome/Edge, Firefox, and
Safari browser push services to prevent arbitrary server-side delivery targets.

The current Render service has no dedicated scheduler. Due scheduled notices are
published when a notification API request runs; configure an authenticated cron
trigger or worker before relying on exact-time delivery. Browser push requires
HTTPS (localhost is permitted for development), browser/OS permission, and
platform support. Legacy or restricted iOS environments may require the portal
to be installed to the Home Screen. In-app notifications remain the fallback.

After deployment, test with a student and admin account: publish an announcement,
verify one bell item and unread count, mark it read, enable push in Settings,
publish a standalone notice, and confirm the notification click opens its local
destination. Use an intentionally expired test subscription to verify it is
deactivated without affecting the in-app record.

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

See [`frontend2/README.md`](frontend2/README.md) for the expected response shapes and frontend architecture.

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

The repository currently has no frontend lint, typecheck, or automated browser-test scripts. Add those before expanding the frontend's production surface. Frontend unit checks run with `npm test`.

Academic Resource preview unit checks are available through `npm run test:preview`.

PDF documents are rendered in-site with React-PDF/PDF.js using a worker bundled
with the frontend. PDF, image, and PPTX card thumbnails load lazily from
authenticated, short-lived preview links. PPTX first slides are rendered locally
and cached in bounded browser memory for the active session; private document
content is not persisted in browser storage. Legacy binary `.ppt` files remain
download-only because the current renderer supports Open XML `.pptx` files and
the deployment does not include a server-side Office conversion runtime.

The current npm audit also reports a moderate React Router advisory whose published fix requires the major React Router 7 migration. This client is browser-rendered rather than SSR, and the only dynamic post-login destination is constrained to a local slash-prefixed path with backslashes and protocol-relative paths rejected. Plan and test the major router upgrade rather than applying it unattended.
