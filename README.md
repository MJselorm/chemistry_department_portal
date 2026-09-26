# GSCS-KNUST Academic Portal

A Chemistry Department portal for the Ghana Society of Chemical Sciences at KNUST. The active application pairs a React/Vite client with a FastAPI API, Firebase Authentication, and a Supabase-hosted PostgreSQL database.

## Project layout

| Path                                                  | Purpose                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `frontend2/`                                          | Active React 18 + Vite portal, including Firebase sign-in and member dashboard.          |
| `backend/`                                            | FastAPI service, Firebase token verification, SQLAlchemy models, and Alembic migrations. |
| `supabase/migrations/`                                | Supabase migration history.                                                              |
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

3. In `frontend2/.env`, set the `VITE_FIREBASE_*` values from the Firebase web app and set `VITE_API_BASE_URL` if the API is not at `http://127.0.0.1:8000`. The Firebase web configuration is client-visible, but the local `.env` remains untracked to keep environments separate.

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
| Render backend  | Copy the keys in [`backend/.env.production.example`](backend/.env.production.example). Set `CORS_ORIGINS` to the exact Vercel frontend URL.                                           |
| Vercel frontend | Copy the keys in [`frontend2/.env.production.example`](frontend2/.env.production.example). Keep `VITE_API_BASE_URL=/api` so the checked-in Vercel rewrite proxies requests to Render. |

For the backend, create a Firebase service-account key in Firebase Console under **Project settings → Service accounts**, then store the complete JSON document as `FIREBASE_SERVICE_ACCOUNT_JSON`. `FIREBASE_SERVICE_ACCOUNT_PATH` is for local development only because a path on your computer is unavailable to the hosted service.

After changing frontend `VITE_*` variables, rebuild and redeploy the frontend; Vite embeds them at build time. After changing backend variables, redeploy or restart the API. A `503 Authentication verification is temporarily unavailable` response means the backend cannot initialize Firebase Admin, usually because `FIREBASE_SERVICE_ACCOUNT_JSON` is missing, malformed, or belongs to a different Firebase project.

## API overview

All protected endpoints require `Authorization: Bearer <firebase_id_token>`.

- `GET /health` verifies that the API is running.
- `POST /auth/sync` creates or updates the Firebase-linked profile idempotently.
- `GET /users/me` reads the authenticated profile.
- `PATCH /users/me` updates the profile's `full_name`.
- `GET /admin/test` verifies the database-backed admin role check.

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
