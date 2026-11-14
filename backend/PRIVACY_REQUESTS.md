# Privacy requests and account deletion review

## Architecture and authorization

The FastAPI service verifies Firebase ID tokens, resolves the matching
database-backed `users` row, and uses that row's `role` as the authorization
source. Request ownership always comes from this validated user; no endpoint
accepts a client-owned `user_id`, role, `resolved_by`, or workflow field.

Only the existing roles are supported:

- `student` may create, list, and export only their own data.
- `admin` may review requests through the admin routes.

There is no super-administrator role in the current schema. Browser Supabase
roles (`anon` and `authenticated`) are revoked from all privacy tables and RLS
is enabled. Privacy-table access is intentionally server-side through FastAPI;
there are no permissive browser RLS policies or service-role values in the
frontend.

## Migration and rollback

Apply the migration before enabling any submission UI:

```powershell
cd backend
python -m alembic upgrade head
```

Revision `20261018_14` creates `privacy_requests`, a minimal
`privacy_audit_events` table, and database-backed `privacy_rate_limits`.
It creates a partial unique index that allows at most one `pending` or
`under_review` request of each type for a user. The API also catches the
database constraint for concurrent submissions and returns HTTP 409.

`python -m alembic downgrade 20261015_13` drops these tables. Do that only
before production use or after an authorized audit-data export: rollback is
structurally reversible but deletes the privacy workflow and audit records.

## Status workflow and deletion safety

The only supported transitions are:

```text
pending -> under_review -> approved | rejected
```

Final decisions require an administrator resolution note and store the trusted
administrator ID plus a timestamp. Cancellation is intentionally not offered.
`approved` for `account_deletion` is a recorded authorization to begin an
offline process, **not** an account deletion command. No API route, trigger,
background job, Storage action, or migration deletes an account.

Before a separate, authorized deletion operation is introduced, an authorized
administrator must verify identity, case approval, legal/institutional
retention obligations, foreign-key dependencies, and backup handling. The
operation must preserve or anonymize required audit rows, must not delete
shared academic resource records or Storage objects, and must be recorded in
an approved operational audit trail. That procedure requires separate review
and is outside this deployment.

## API

Every endpoint below needs `Authorization: Bearer <firebase_id_token>`.

### Create a request

`POST /privacy/requests`

```json
{"request_type":"data_export","details":"Please provide my account data."}
```

Only `data_export`, `account_deletion`, and an optional 2,000-character
`details` field are accepted. Ownership and status are server-controlled.
Returns `201` with `id`, type, status, and timestamps. A duplicate active type
returns `409`; invalid or injected fields return `422`.

### View your requests

`GET /privacy/requests?limit=20&offset=0`

Returns paginated request summaries owned by the caller only. It excludes
internal review notes and administrator attribution.

### Export your personal data

`GET /privacy/export`

Returns an attachment named `chemistry-hub-personal-data.json`. Version 1.0
includes the caller's account/profile fields, their notification read state,
safe push-subscription metadata, and their privacy requests. It excludes
passwords, ID tokens, API/service credentials, push endpoints and keys, other
users' records, internal administration, and shared academic materials. Exports
are generated in memory on the server; no export artifact is stored.

### Administrator review

- `GET /admin/privacy/requests?status=pending&limit=25&offset=0`
- `GET /admin/privacy/requests/{request_id}`
- `PATCH /admin/privacy/requests/{request_id}`

An update accepts only `status` and `resolution_note`, for example:

```json
{"status":"approved","resolution_note":"Identity and retention review completed."}
```

The route checks the database `admin` role, validates the workflow, records
the acting administrator server-side, and writes content-free audit metadata.

## Rate limits, audit, and retention

The service atomically tracks fixed-window counts in PostgreSQL for both the
authenticated user and an HMAC-pseudonymized peer IP. This works across API
instances and returns HTTP 429 with `Retry-After` when a limit is exceeded.
Set `PRIVACY_RATE_LIMIT_SALT` to a long random server-only deployment secret.

Default limits per hour are five requests, three exports, and 120 admin
operations; all are configurable with the `PRIVACY_*_RATE_LIMIT` variables.
Audit events record actor, request ID, action, time, pseudonymized IP, and a
short non-sensitive action label. They never log request text or exported data.

Proposed operational retention pending institutional/legal approval:

- resolved/rejected requests and their audit events: seven years after final decision;
- rate-limit rows: 90 days after their window;
- exported data: not retained (the response is generated in memory only).

No automatic cleanup job is installed. Any deletion/anonymization of records
must be separately approved, documented, and performed by an authorized
operator until an institutional retention schedule is approved.

## Deployment checklist and limitations

1. Set `PRIVACY_CONTACT_EMAIL`, `PRIVACY_RATE_LIMIT_SALT`, trusted CORS
   origins, database URL, and Firebase credentials in server-side settings.
2. Apply Alembic revision `20261018_14` with the deployment database role.
3. Verify RLS is enabled and `anon`/`authenticated` have no table grants.
4. Run the backend tests and test each endpoint with real student and admin
   identities in a non-production environment.
5. Have the institution approve the support contact, retention schedule,
   request-review staff, and manual deletion procedure.
6. Only then replace the current frontend informational modal with submissions.

The repository does not yet have a production RLS integration environment,
multi-instance load test, institutional retention approval, or a manual
account-deletion runbook signed by the data controller. Those conditions must
be verified before turning on the UI controls.
