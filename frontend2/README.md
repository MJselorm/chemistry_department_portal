# GSCS-KNUST Academic Portal — React frontend

Two screens: the split sign-in landing page and the member dashboard. Built with Vite, React 18,
React Router, Tailwind, and Firebase Authentication. All network access goes through one client
module, so wiring additional FastAPI routes means editing `endpoints.js` in one place.

## Run it

```bash
npm install
# Copy .env.example to .env, then add the VITE_FIREBASE_* values from Firebase Console.
npm run dev
```

With `VITE_USE_MOCKS=true`, dashboard content falls back to sample data when its corresponding
API route is not available. Authentication always uses Firebase. Set it to `false` once the
dashboard API is live.

Drop a lab photo at `public/lab-hero.jpg` for the landing page background. Without it the panel
falls back to the dark gradient, which still looks correct.

## Where things live

| Path | Purpose |
| --- | --- |
| `client.js` | fetch wrapper: base URL, Firebase bearer token, FastAPI error shapes |
| `endpoints.js` | every backend route in one object |
| `mocks.js` | sample dashboard data + expected response shapes |
| `useApi.js` | `useResource(path, fallback)` — GET on mount, with reload |
| `AuthContext.jsx` | Firebase login, logout, profile sync, and session restore |
| `LoginPage.jsx` | landing / sign-in screen |
| `DashboardPage.jsx` | dashboard screen |

## What the backend needs to expose

Firebase handles email/password and Google sign-in. On login and session restoration, the client
sends the Firebase ID token in `Authorization: Bearer <token>` and expects these profile routes:

```
POST /auth/sync
GET /users/me
```

Every other route is a plain JSON GET with `Authorization: Bearer <token>`:

- `GET /users/me` → the Firebase-linked profile created by `/auth/sync`
- `GET /dashboard/summary` → the four stat-card fields (see `MOCK_SUMMARY`)
- `GET /events/upcoming` → `[{id, title, month, day, venue, time_range, rsvp_status, featured}]`
- `POST /events/{id}/rsvp`
- `GET /announcements` → `[{id, category, category_label, posted_ago, title, body}]`
  where `category` is one of `safety`, `directory`, `execs`
- `POST /lab/slots/reserve`

Match those field names and the components need no changes. If you'd rather keep your own naming,
map the response once inside `useResource`'s caller rather than spreading renames through the JSX.

## CORS

Two options. Either allow the dev origin in FastAPI:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

or leave CORS alone and set `VITE_API_BASE_URL=/api`, which routes through the Vite proxy already
configured in `vite.config.js`.

## Notes on the token

It's kept in `localStorage` for simplicity. If you move to httpOnly refresh cookies later, the only
file that changes is `client.js` — swap `tokenStore` for `credentials: 'include'`.
