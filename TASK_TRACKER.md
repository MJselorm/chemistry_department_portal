# Project Task Tracker

This is a source-based snapshot, not a claim about a live deployment or an authoritative product backlog. "Completed" means the implementation is present in the inspected repository; it does not mean production rollout or acceptance was independently verified.

## Completed in source

- Firebase client sign-in and backend ID-token verification/profile synchronization.
- Database-backed student/admin/super-admin authorization and MFA-gated super-admin role approvals.
- Directory, announcements, events, academic-resource APIs, and frontend views.
- In-app notifications, user read state, browser push subscription/delivery support.
- Privacy request/export workflows, manual administrative review, legacy-path audit/rate-limit helpers, and frontend request controls.
- Mentor/mentee applications, preference-aware match proposals, participant progress/session workflows, and admin oversight.
- Vite SPA routes, legal pages, cookie-preference controls, local document previews for supported formats, and Vercel security-header configuration.

Source verification: `backend/app/routers/`, `backend/app/services/`, `backend/app/models.py` plus domain model modules, and `frontend2/App.jsx`/feature pages. The verified endpoint inventory is in [API_REFERENCE.md](API_REFERENCE.md).

## In progress

- No explicit in-progress marker was found in the inspected source or checked-in task documentation. This means status is unknown, not that no work is in progress.

## Pending operational verification

- Apply the current Alembic head (`20261114_21`) in the intended environment using a trusted database identity. Source does not establish that a live database has been migrated.
- Confirm the actual Vercel production origin matches Render `CORS_ORIGINS`; the checked-in origin and deployed frontend host could not be reconciled from source alone.
- Select and securely bootstrap the intended verified Super Admin, confirm Firebase MFA enrollment/project settings, and test approval with a recent second-factor token. The migration adds the role but does not promote an account.
- Configure and validate production Firebase, Supabase Storage, support contact, and VAPID values using provider-managed secrets.
- Provide an authenticated scheduler/worker or equivalent trigger if scheduled notices must publish at an exact time. Current Render configuration has no dedicated scheduler; due notices are processed on notification API activity.
- Complete the production checklist in `README.md`, including backups/restoration, policy/legal review, and end-to-end checks against real services.

These are operational follow-ups documented in source/readme, not verified live tasks.

## Known issues and technical debt

- `backend/EVENTS.md` says every event route requires a bearer token; the current `/api/events/health` handler is public.
- `backend/PRIVACY_REQUESTS.md` predates the current super-admin role and newer `/api/privacy` route family. Reconcile this focused guide with current routes and status schemas.
- `README.md` says the `/api/privacy/requests/export` endpoint creates an audit record, but its handler does not call `audit_privacy_event`; clarify or align this statement with the implementation.
- Privacy has two active route families (`/privacy` and `/api/privacy`) with different request/response/status conventions. Avoid adding another; decide whether to consolidate only with an explicit compatibility plan.
- The frontend uses `/api/privacy`, but these handlers do not currently call the privacy audit/rate-limit helpers used by the legacy `/privacy` handlers. Reconcile this documented behavior gap before treating the frontend workflow as covered by those controls.
- Revision `20261101_18` creates `api_rate_limits`, but the source audit found no ORM class or application reference for that table; the privacy service instead uses `privacy_rate_limits`. Verify whether the migration-only table is still intended before adding or changing rate-limit behavior.
- The checked-in `CORS_ORIGINS` production origin must be compared with the real deployed frontend hostname; the source audit cannot verify the live domain.
- Notification scheduling has no dedicated scheduler configured.
- The frontend has Node unit tests but no configured lint, type-check, or browser end-to-end test script.
- The repository README records a moderate React Router advisory whose fix requires a major-version migration; plan/test that upgrade rather than applying it unattended.
- HTML and arbitrary binary files are not treated as previewable; legacy `.ppt` remains download-only. Do not silently broaden document preview behavior.
- No institution-approved retention schedule or automated account-deletion process is established in the repository; privacy deletion requests are reviewed manually and do not delete accounts automatically.
- No TODO/FIXME marker was found in the inspected backend application modules; that is not evidence that the product backlog is empty.

## Verification snapshot

| Check | Result | Notes |
|---|---|---|
| Backend pytest | 89 passed | Run from `backend/`; `CORS_ORIGINS` was set to the test's localhost:5173 origins because the shell environment otherwise supplied only localhost:5500. |
| Frontend Node tests | 10 passed | `npm test` from `frontend2/`. |
| Frontend production build | Succeeded | `npm run build` from `frontend2/`. |
| Alembic chain | One head, `20261114_21` | `alembic heads`; this does not verify a live database. |

## Recommended next steps

1. Reconcile `backend/EVENTS.md` and `backend/PRIVACY_REQUESTS.md` against `API_REFERENCE.md`.
2. Verify production CORS/domain and migration status with deployment owners.
3. Add a scheduled trigger/worker if exact-time notification scheduling is required.
4. Add frontend lint/type-check and browser end-to-end checks before materially expanding the UI surface.
5. Track the React Router major upgrade and unsupported preview formats as explicit product/maintenance decisions.
