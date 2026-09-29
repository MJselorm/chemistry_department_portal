# Chemistry Hub React frontend

The active client is a React 18, React Router, Tailwind, Firebase Authentication, and Vite single-page application. It contains authenticated student pages, database-backed admin pages, password recovery, and public privacy and terms pages.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Configure every `VITE_FIREBASE_*` value. Point `VITE_API_BASE_URL` at FastAPI, normally `http://127.0.0.1:8000`. `VITE_USE_MOCKS=true` enables sample content for optional dashboard features that do not yet have backend routes. Set `VITE_SUPPORT_EMAIL` to a verified public institutional address before production.

## Architecture

| Path | Purpose |
| --- | --- |
| `App.jsx` | Lazy-loaded public, student, and admin routes |
| `AuthContext.jsx` | Firebase persistence, sign-in, token refresh, logout, password reset, and profile sync |
| `client.js` | Authenticated Fetch wrapper and safe API error normalization |
| `endpoints.js` | Central API route definitions |
| `directory/` | Student directory views and admin CRUD interfaces |
| `LegalPage.jsx` | Privacy Notice and Terms of Use |
| `vercel.json` | Render API rewrites and production security headers |

## Authentication and storage

Firebase manages the browser session. The **Keep me signed in** option selects Firebase local or session persistence. The FastAPI bearer token is held only in module memory and refreshed through Firebase's `onIdTokenChanged`; Chemistry Hub does not copy it into `localStorage`.

Application-owned browser storage is limited to:

- `chemhub-theme`: light/dark preference
- `chemhub-sidebar-collapsed`: desktop navigation preference

Do not add credentials, personal records, API responses, or authorization state to browser storage. React admin route guards are convenience controls only; FastAPI remains the authorization boundary.

## Backend contract

All application routes except `/health` require `Authorization: Bearer <firebase_id_token>`.

- `POST /auth/sync`: provision or read the Firebase-linked profile
- `GET/PATCH /users/me`: read or update the authenticated profile
- `GET /announcements`: authenticated announcements
- `POST/DELETE /admin/announcements`: admin-only announcement management
- `/api/directory/*`: authenticated reads and admin-only writes/uploads
- `GET /admin/test`: verify the database-backed admin role

Several event, academic-resource, notification, and settings endpoints in `endpoints.js` remain placeholders. Do not present those workflows as production-complete until matching backend routes exist.

## Production deployment

Vercel rewrites `/api/*` to the Render service. Keep `VITE_API_BASE_URL=/api` in production and review the fixed backend destination in `vercel.json` whenever the service changes.

`vercel.json` configures CSP, anti-framing, HSTS, MIME-sniffing, referrer, and permissions headers. When adding an external API, font, image provider, or authentication domain, update CSP narrowly and test sign-in before deployment. Do not replace the policy with broad wildcards or `unsafe-eval`.

The application is intentionally marked `noindex, nofollow`, and `public/robots.txt` disallows crawling because it is an authenticated portal. There is no sitemap.

## Verification

```bash
npm ci
npm run build
npm audit --omit=dev
```

There are currently no frontend lint, typecheck, or automated browser-test scripts. Production smoke testing must cover sign-in, password reset, logout, student/admin routing, announcements, directory reads and admin CRUD, uploads, legal routes, dark mode, mobile navigation, and CSP behavior.
