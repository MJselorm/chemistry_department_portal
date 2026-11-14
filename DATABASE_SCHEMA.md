# Database Schema

This is the SQLAlchemy/Alembic schema represented by the checked-in application. It is not a dump or verification of a live database. Types below use compact aliases: `UUID` = PostgreSQL UUID, `int` = integer, `bigint` = bigint, `bool` = boolean, `str(n)` = bounded string, `text` = text, `dt` = timezone-aware datetime, `date`, `time`, and `jsonb`. Nullability is not exhaustively repeated; check the ORM model and migration before changing a column.

## Database access and migration rules

- Production uses PostgreSQL through SQLAlchemy/psycopg; local settings may use SQLite. `backend/app/database.py` creates the engine/session and exposes `get_db`.
- Domain ORM classes are in `backend/app/models.py`, `event_models.py`, `directory_models.py`, and `mentorship_models.py`. `backend/alembic/env.py` imports these modules before reading `Base.metadata`.
- Alembic is the schema authority. Use the existing revision chain; do not use `Base.metadata.create_all()` for application schema changes.
- Routes commonly receive a SQLAlchemy `Session` through `Depends(get_db)`, filter user-owned records by the verified profile ID, and commit/rollback transactionally. Role-change approval and mentorship workflows use row locking/unique constraints for concurrency-sensitive state transitions.
- Selected backend-only tables enable RLS and revoke direct `PUBLIC`, `anon`, and `authenticated` grants. This is not a blanket claim that every application table has RLS; check the migration for each table.
- The database used for this reference was not live-introspected. If migrations have not been applied, the deployed schema may differ.

## Core, privacy, administration, notifications, resources, events

Source: `backend/app/models.py`, `backend/app/event_models.py`.

| Table | Columns (PK first) | Relationships and notable constraints/indexes |
|---|---|---|
| `users` | `id UUID`; `firebase_uid str`; `email str`; `full_name str(200)`; `role str(20)`; `created_at dt`; `updated_at dt` | PK `id`; unique/indexed `firebase_uid`; role check allows `student`, `admin`, `super_admin`. |
| `privacy_requests` | `id UUID`; `user_id UUID`; `requester_email str(320)`; `requester_name str(200)`; `request_type str(30)`; `details text`; `reason text`; `status str(30)`; `created_at dt`; `updated_at dt`; `resolved_at dt`; `resolved_by_id UUID`; `resolution_note text` | `user_id` and `resolved_by_id` reference `users` with `SET NULL`; type/status checks; indexes on user, type, status, `(user_id, created_at)`; partial unique `(user_id, request_type)` while status is `pending`, `under_review`, or `in_review`. |
| `privacy_audit_events` | `id UUID`; `privacy_request_id UUID`; `actor_user_id UUID`; `event_type str(80)`; `ip_hash str(64)`; `detail str(200)`; `created_at dt` | Request/user FKs use `RESTRICT`; indexes on request, actor, event type, created time and `(actor_user_id, created_at)`. Event details are intended to omit request content/export data. |
| `privacy_rate_limits` | `id UUID`; `scope str(130)`; `action str(50)`; `window_started_at dt`; `count int`; `updated_at dt` | Unique `(scope, action, window_started_at)` supports shared fixed-window counters. |
| `api_rate_limits` | Composite PK `(scope str(100), identifier_hash str(64))`; `window_started_at dt`; `request_count int`; `expires_at dt` | Check `request_count >= 1`; index on `expires_at`; migration enables RLS and revokes browser-role grants. Created by revision `20261101_18`; no ORM class or application reference was found in the source audit. |
| `admin_role_audit` | `id UUID`; `actor_user_id UUID`; `target_user_id UUID`; `request_id UUID`; `previous_role str(20)`; `new_role str(20)`; `changed_at dt` | Actor/target/request FKs use `RESTRICT`; request links to `admin_role_change_requests`. |
| `admin_role_change_requests` | `id UUID`; `requester_user_id UUID`; `target_user_id UUID`; `approver_user_id UUID`; `previous_role str(20)`; `requested_role str(20)`; `status str(20)`; `resolution_note str(500)`; `requested_at dt`; `resolved_at dt` | Requester/target/approver FKs use `RESTRICT`; role/status checks; partial unique index allows at most one pending request per target. |
| `announcements` | `id UUID`; `title str(200)`; `body text`; `category str(50)`; `audience str(50)`; `issuer str(200)`; `is_pinned bool`; `published_at dt`; `created_by_id UUID`; `publication_key str(100)` | PK `id`; `publication_key` unique when set. `created_by_id` is stored without a declared ORM FK. |
| `notifications` | `id UUID`; `title str(200)`; `message text`; `category str(50)`; `priority str(20)`; `audience_type str(30)`; `target_user_id UUID`; `destination_path str(500)`; `announcement_id UUID`; `event_key str(180)`; `status str(20)`; `scheduled_for dt`; `published_at dt`; `created_by_id UUID`; `created_at dt` | Target user/announcement FKs cascade; creator FK restricts. Checks constrain priority, audience, status. Unique idempotency keys for announcement/event; indexes on status/schedule/publication time. |
| `notification_reads` | Composite PK `(notification_id UUID, user_id UUID)`; `read_at dt`; `dismissed_at dt` | Both FKs cascade to notification/user. |
| `push_subscriptions` | `id UUID`; `user_id UUID`; `endpoint text`; `p256dh text`; `auth text`; `user_agent str(500)`; `is_active bool`; `failure_count int`; `created_at dt`; `updated_at dt` | User FK cascades; endpoint unique; user indexed. Push endpoint/key values are sensitive and must not be included in personal-data exports. |
| `push_deliveries` | `id UUID`; `notification_id UUID`; `subscription_id UUID`; `attempt_number int`; `status str(20)`; `error_code str(100)`; `attempted_at dt` | Notification/subscription FKs cascade; unique `(notification_id, subscription_id, attempt_number)`; notification indexed. |
| `resource_folders` | `id int`; `name str(500)`; `description text`; `folder_path text`; `parent_folder_path text`; `level str(50)`; `is_active bool`; `last_synced_at dt`; `created_at dt`; `updated_at dt` | Parent path and level indexed. |
| `resources` | `id int`; `name str(500)`; `title str(500)`; `file_name str(500)`; `label str(100)`; `description text`; `resource_type str(100)`; `course_code str(50)`; `course_name str(255)`; `level str(50)`; `category str(100)`; `folder_path text`; `mime_type str(255)`; `file_size bigint`; `supabase_bucket str(255)`; `supabase_storage_path text`; `storage_migrated_at dt`; `academic_year str(50)`; `semester str(50)`; `lecturer str(255)`; `department str(255)`; `download_available bool`; `is_active bool`; `is_missing bool`; `last_synced_at dt`; `created_at dt`; `updated_at dt` | Indexes support name/label/type/course/level/category/folder/academic-year/semester/lecturer/department and active/missing filters. |
| `events` | `id UUID`; `title str(300)`; `description text`; `event_type str(100)`; `organizer str(255)`; `location str(255)`; `start_datetime dt`; `end_datetime dt`; `registration_url text`; `image_url text`; `capacity int`; `contact_email str(255)`; `contact_phone str(50)`; `department str(255)`; `target_audience str(255)`; `status str(20)`; `is_published bool`; `created_by UUID`; `created_at dt`; `updated_at dt` | Status check; indexes on title/type/organizer/location/start time/department/status/published/creator. `created_by` has no declared ORM FK. |

## Directory tables

Source: `backend/app/directory_models.py`. The directory's `Timestamped` base contributes integer `id`, `is_active bool`, `created_at dt`, and `updated_at dt` to the entity tables below except `committee_members`, which has its own timestamp fields and no `is_active` column.

| Table | Additional columns | Relationships and notable constraints/indexes |
|---|---|---|
| `departments` | `name str(200)`; `code str(30)`; `description text`; `email str(255)`; `phone str(50)`; `location str(255)`; `website str(500)` | Unique department name and code. |
| `executives` | `name str(200)`; `position str(150)`; `student_id str(80)`; `level str(50)`; `program str(150)`; `phone str(50)`; `email str(255)`; `photo_url str(500)`; `academic_year str(20)`; `department_id int`; `bio text`; `display_order int` | Department FK uses `RESTRICT`. |
| `class_representatives` | `name str(200)`; `student_id str(80)`; `phone str(50)`; `email str(255)`; `level str(50)`; `class_name str(150)`; `program str(150)`; `academic_year str(20)`; `department_id int`; `photo_url str(500)` | Department FK uses `RESTRICT`. |
| `lecturers` | `name str(200)`; `title str(100)`; `staff_id str(80)`; `department_id int`; `faculty str(150)`; `email str(255)`; `phone str(50)`; `office str(150)`; `specialization str(300)`; `qualification str(300)`; `bio text`; `photo_url str(500)` | Department FK uses `RESTRICT`; staff ID unique. |
| `courses` | `course_code str(30)`; `course_name str(200)`; `description text`; `credit_hours int`; `level str(50)`; `semester str(50)`; `department_id int`; `lecturer_id int` | Department FK `RESTRICT`, lecturer FK `SET NULL`; unique `(course_code, department_id)`. |
| `course_representatives` | `name str(200)`; `student_id str(80)`; `phone str(50)`; `email str(255)`; `course_id int`; `level str(50)`; `semester str(50)`; `academic_year str(20)`; `department_id int`; `photo_url str(500)` | Course/department FKs use `RESTRICT`; unique `(course_id, academic_year)`. |
| `lecturer_consultations` | `lecturer_id int`; `day_of_week str(20)`; `start_time time`; `end_time time`; `location str(200)`; `mode str(50)`; `instructions text` | Lecturer FK uses `RESTRICT`. |
| `clubs` | `name str(200)`; `acronym str(30)`; `description text`; `category str(100)`; `president str(200)`; `contact_email str(255)`; `contact_phone str(50)`; `meeting_location str(200)`; `meeting_day str(30)`; `meeting_time time`; `logo_url str(500)`; `social_links text`; `department_id int` | Department FK uses `RESTRICT`; name unique. |
| `committees` | `name str(200)`; `description text`; `purpose text`; `chairperson str(200)`; `secretary str(200)`; `contact_email str(255)`; `contact_phone str(50)`; `department_id int`; `academic_year str(20)` | Department FK uses `RESTRICT`. |
| `committee_members` | `id int`; `committee_id int`; `name str(200)`; `role str(100)`; `student_id str(80)`; `email str(255)`; `phone str(50)`; `photo_url str(500)`; `created_at dt`; `updated_at dt` | Committee FK uses `RESTRICT`. |
| `department_contacts` | `name str(200)`; `role str(150)`; `department str(200)`; `description text`; `phone str(50)`; `email str(255)`; `office str(150)`; `location str(200)`; `website str(500)`; `category str(100)` | Uses the shared timestamped base. |

## Mentorship tables

Source: `backend/app/mentorship_models.py`. JSON preference/list fields use PostgreSQL `jsonb`.

| Table | Columns (PK first) | Relationships and notable constraints/indexes |
|---|---|---|
| `mentor_applications` | `id UUID`; `user_id UUID`; `academic_level str(20)`; `programme str(120)`; `subjects jsonb`; `areas_of_expertise jsonb`; `mentorship_goals jsonb`; `availability jsonb`; `teaching_style str(30)`; `communication_method str(30)`; `experience str(1000)`; `preferred_capacity int`; `introduction str(500)`; `status str(20)`; `reviewed_by_id UUID`; `review_note str(500)`; `created_at dt`; `updated_at dt` | User FK cascades; reviewer FK sets null; unique user; level/capacity/status checks; status index. |
| `mentee_applications` | `id UUID`; `user_id UUID`; `academic_level str(20)`; `programme str(120)`; `subjects jsonb`; `interests jsonb`; `learning_difficulties jsonb`; `learning_goals jsonb`; `availability jsonb`; `learning_style str(30)`; `communication_method str(30)`; `preferences str(500)`; `status str(20)`; `created_at dt`; `updated_at dt` | User FK cascades; level/status checks; user/status indexes; partial unique user while waiting/matched. |
| `mentorship_matches` | `id UUID`; `mentor_user_id UUID`; `mentee_user_id UUID`; `mentee_application_id UUID`; `status str(20)`; `match_score int`; `score_breakdown jsonb`; `shared_subjects jsonb`; `mentor_accepted_at dt`; `mentee_accepted_at dt`; `mentor_completed_at dt`; `mentee_completed_at dt`; `created_at dt`; `updated_at dt` | User/application FKs restrict; status/score checks; partial unique open mentee and open-mentor indexes; status/created indexes. |
| `mentorship_goals` | `id UUID`; `match_id UUID`; `created_by_id UUID`; `title str(250)`; `status str(20)`; `completed_at dt`; `created_at dt` | Match FK cascades; creator FK restricts; status check; match index. |
| `mentorship_progress_notes` | `id UUID`; `match_id UUID`; `author_user_id UUID`; `body str(1000)`; `created_at dt` | Match FK cascades; author FK restricts; match index. |
| `mentorship_sessions` | `id UUID`; `match_id UUID`; `created_by_id UUID`; `submission_key UUID`; `session_date date`; `topic str(200)`; `notes str(1000)`; `status str(30)`; `mentor_confirmed_at dt`; `mentee_confirmed_at dt`; `completed_at dt`; `created_at dt` | Match FK cascades; creator FK restricts; status check; unique `(match_id, submission_key)` and `(match_id, session_date, topic)`; match/date index. |
| `mentorship_reassignment_requests` | `id UUID`; `match_id UUID`; `requester_user_id UUID`; `reason str(500)`; `status str(20)`; `resolved_by_id UUID`; `resolution_note str(500)`; `created_at dt`; `resolved_at dt` | Match/requester FKs restrict; reviewer FK sets null; status check; partial unique pending request per match; status index. |
| `mentorship_feedback` | `id UUID`; `match_id UUID`; `author_user_id UUID`; `feedback str(1000)`; `created_at dt` | Match FK cascades; author FK restricts; unique `(match_id, author_user_id)`. |
| `mentorship_notification_preferences` | `user_id UUID`; `in_app_enabled bool`; `updated_at dt` | User is both PK and cascading FK. |
| `mentorship_audit` | `id UUID`; `actor_user_id UUID`; `subject_user_id UUID`; `match_id UUID`; `event_type str(40)`; `outcome str(40)`; `details str(500)`; `created_at dt` | User/match FKs set null; event-type check; created-time index. |

## Migration history

The verified linear Alembic chain is:

| Revision | File suffix | Schema purpose |
|---|---|---|
| `20260917_01` | `create_users` | Initial user table |
| `20260920_02` | `two_user_roles` | User role constraint/data update |
| `20260923_03` | `student_directory` | Directory schema |
| `20260923_04` | `seed_chemical_department` | Department seed data |
| `20260923_05` | `announcements` | Announcements |
| `20260924_06` | `resources` | Academic resources |
| `20260929_07` | `events` | Events |
| `20260929_08` | `resource_metadata_compatibility` | Resource metadata compatibility |
| `20261003_09` | `resource_storage_location` | Resource storage metadata |
| `20261004_10` | `resource_label` | Resource labels |
| `20261004_11` | `backfill_resource_folder_metadata` | Folder metadata backfill |
| `20261015_12` | `remove_google_drive` | Remove Google Drive schema/runtime support |
| `20261015_13` | `notifications_and_push` | Notifications and push subscriptions/deliveries |
| `20261018_14` | `privacy_requests` | Initial privacy requests |
| `20261027_15` | `admin_role_management` | Role-change request/audit schema |
| `20261031_16` | `super_admin_approval_workflow` | Distinct Super Admin approval flow |
| `20261031_17` | `mentorship_programme` | Mentorship applications, matches, goals, sessions, audit |
| `20261101_18` | `api_rate_limits` | Shared API rate-limit schema |
| `20261108_19` | `notification_event_keys` | Notification event idempotency keys |
| `20261108_20` | `matching_preferences` | Mentorship preferences and score breakdown |
| `20261114_21` | `unify_privacy_workflow` | Reconciles privacy schema variants, audit/rate-limit tables, and status/index definitions |

Revision identifiers and `down_revision` links are in `backend/alembic/versions/`. The current head is `20261114_21`; the source does not establish that any production database has applied it. Run `python -m alembic upgrade head` from `backend/` only against the intended environment and with a trusted database identity.
