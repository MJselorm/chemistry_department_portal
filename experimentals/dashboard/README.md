# GSCS-KNUST Academic Portal — React frontend

Two screens: the split sign-in landing page and the member dashboard. Built with Vite, React 18,
React Router and Tailwind. All network access goes through one client module, so wiring it to
FastAPI later means editing `src/api/endpoints.js` and nothing else.

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

With `VITE_USE_MOCKS=true` both screens render from sample data and any email/password signs you
in, so you can build the backend afterwards. Set it to `false` once the API is live.

Drop a lab photo at `public/lab-hero.jpg` for the landing page background. Without it the panel
falls back to the dark gradient, which still looks correct.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/api/client.js` | fetch wrapper: base URL, bearer token, FastAPI error shapes |
| `src/api/endpoints.js` | every backend route in one object |
| `src/api/mocks.js` | sample data + the response shapes your API should return |
| `src/api/useApi.js` | `useResource(path, fallback)` — GET on mount, with reload |
| `src/context/AuthContext.jsx` | login, logout, session restore on refresh |
| `src/pages/LoginPage.jsx` | landing / sign-in screen |
| `src/pages/DashboardPage.jsx` | dashboard screen |

## What the backend needs to expose

Auth uses the standard FastAPI password flow, so the login call posts
`application/x-www-form-urlencoded` with `username` and `password`:

```python
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    return {"access_token": create_token(user), "token_type": "bearer"}

@router.get("/me")
def me(user = Depends(current_user)):
    return user
```

Every other route is a plain JSON GET with `Authorization: Bearer <token>`:

- `GET /auth/me` → `{id, full_name, first_name, programme, year, student_id, faculty, avatar_url}`
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
file that changes is `src/api/client.js` — swap `tokenStore` for `credentials: 'include'`.

## Academic hub screen (`/hub`)

The third screen — greeting, day timetable, module progress, deadline banner and the side column —
lives in `src/pages/AcademicHubPage.jsx` with its parts under `src/components/hub/`. It reuses the
Hexagon palette rather than the olive/cream of the original reference: ink navy for the deadline
banner and the selected day, cyan for progress and links, and pale blue / cyan / amber tints for
the three session-card types.

Routes it expects (see `HUB_ENDPOINTS` in `src/api/endpoints.js`, shapes in `src/api/hubMocks.js`):

- `GET /hub/today` → `{greeting_name, date_label, summary_line, week, days[], sessions[]}`
  where a session is `{id, time_range, kind, tag, course_code, title, venue, current}` and
  `kind` is one of `lecture`, `lab`, `workshop`
- `GET /hub/modules` → `[{id, course_code, title, subtitle, status, status_tone, percent, accent}]`
  with `status_tone` in `urgent | done | active` and `accent` in `cyan | amber | blue`
- `GET /hub/deadline` → `{label, remaining, title, due_day, due_time}`
- `GET /hub/note` → `{eyebrow, title, body, link_label, href}`
- `GET /hub/events` → `[{id, day, month, title, meta}]`
- `GET /hub/directory` → `{peer_count}`

The day selector currently only sets local state. To load a different day from the server, pass the
selected id into the request — `useResource(`${HUB_ENDPOINTS.today}?day=${selectedDay}`, MOCK_TODAY)`
— since the hook re-fetches whenever the path changes.
