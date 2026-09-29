# Event Management API

Apply the migration before use:

```powershell
python -m alembic upgrade head
```

All routes require the existing Firebase bearer token. `POST`, `PATCH`,
`DELETE`, `/publish`, and `/cancel` additionally require the existing database
`admin` role. Reads only expose published, non-cancelled events.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/events/health` | Module health check |
| GET | `/api/events` | Published, paginated event list |
| GET | `/api/events/upcoming` | Upcoming published events |
| GET | `/api/events/{event_id}` | Published event detail |
| POST | `/api/events` | Create a draft event (admin) |
| PATCH | `/api/events/{event_id}` | Update an event (admin) |
| DELETE | `/api/events/{event_id}` | Soft-cancel an event (admin) |
| POST | `/api/events/{event_id}/publish` | Publish a draft (admin) |
| POST | `/api/events/{event_id}/cancel` | Cancel while preserving history (admin) |

`GET /api/events` accepts `page`, `limit`, `search`, `event_type`,
`department`, `organizer`, `location`, `status`, `date_from`, and `date_to`.
Create/update dates must include timezone offsets and `end_datetime` must be
after `start_datetime`.

Example create body:

```json
{
  "title": "AI & Robotics Workshop",
  "event_type": "workshop",
  "organizer": "AAENICS Robotics Club",
  "location": "UMaT ICT Lab",
  "start_datetime": "2026-10-08T09:00:00+00:00",
  "end_datetime": "2026-10-08T15:00:00+00:00",
  "capacity": 100,
  "target_audience": "Students"
}
```
