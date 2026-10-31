from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.mentorship_models import (
    MentorApplication,
    MenteeApplication,
    MentorshipFeedback,
    MentorshipGoal,
    MentorshipMatch,
    MentorshipNotificationPreference,
    MentorshipReassignmentRequest,
    MentorshipSession,
)
from app.mentorship_schemas import (
    CompletionCreate,
    GoalCreate,
    MenteeApplicationCreate,
    MentorApplicationCreate,
    ReassignmentDecision,
    SessionCreate,
)
from app.models import Notification, User
from app.routers import mentorship as mentorship_router
from app.security import get_current_user
from app.services.mentorship import compatibility_score, notify_user, participant_match


def _mentor(level="200", capacity=1):
    return MentorApplication(
        user_id=uuid4(),
        academic_level=level,
        subjects=["Organic Chemistry", "Analytical Chemistry"],
        availability=["Weekday evenings"],
        preferred_capacity=capacity,
        status="approved",
        created_at=datetime.now(timezone.utc),
    )


def _mentee(level="100"):
    return MenteeApplication(
        user_id=uuid4(),
        academic_level=level,
        subjects=["organic chemistry"],
        learning_goals=["Understand reaction mechanisms"],
        availability=["weekday evenings"],
        status="waiting",
    )


def test_rules_based_match_score_and_mandatory_eligibility():
    score, subjects = compatibility_score(_mentor(), _mentee(), active_capacity=0)
    assert score == 100
    assert subjects == ["organic chemistry"]
    assert compatibility_score(_mentor(), _mentee("300"), active_capacity=0) is None
    assert compatibility_score(_mentor(capacity=1), _mentee(), active_capacity=1) is None


def test_subject_overlap_is_mandatory_and_postgraduate_peers_are_eligible():
    mentor = _mentor(level="postgraduate")
    mentee = _mentee(level="postgraduate")
    mentee.subjects = ["Physical Chemistry"]
    assert compatibility_score(mentor, mentee, active_capacity=0) is None
    mentee.subjects = ["Organic Chemistry"]
    assert compatibility_score(mentor, mentee, active_capacity=0) is not None


def test_application_schemas_normalize_and_validate_inputs():
    mentor = MentorApplicationCreate(
        academic_level="300",
        subjects=["  Organic Chemistry ", "Organic Chemistry"],
        availability=[" Saturday mornings "],
    )
    assert mentor.subjects == ["Organic Chemistry"]
    assert mentor.availability == ["Saturday mornings"]
    session = SessionCreate(
        submission_key=uuid4(),
        session_date=datetime.now(timezone.utc).date(),
        topic="  Organic   Chemistry ",
    )
    assert session.topic == "organic chemistry"
    with pytest.raises(ValueError):
        MenteeApplicationCreate(
            academic_level="100",
            subjects=["  "],
            learning_goals=["Understand chemistry"],
            availability=["Weekends"],
        )


class _NotificationSession:
    def __init__(self, preference=None):
        self.preference = preference
        self.added = []

    def get(self, model, _user_id):
        assert model is MentorshipNotificationPreference
        return self.preference

    def add(self, item):
        self.added.append(item)


def test_notifications_reuse_user_scoped_in_app_records_and_preferences():
    user_id = uuid4()
    actor_id = uuid4()
    enabled = _NotificationSession(MentorshipNotificationPreference(user_id=user_id, in_app_enabled=True))
    notify_user(enabled, recipient_id=user_id, actor_id=actor_id, title="Match", message="Review your match.")
    notification = enabled.added[0]
    assert isinstance(notification, Notification)
    assert notification.category == "mentorship"
    assert notification.audience_type == "individual"
    assert notification.target_user_id == user_id
    assert notification.destination_path == "/mentorship"
    disabled = _NotificationSession(MentorshipNotificationPreference(user_id=user_id, in_app_enabled=False))
    notify_user(disabled, recipient_id=user_id, actor_id=actor_id, title="Match", message="Review your match.")
    assert disabled.added == []


def test_match_access_is_limited_to_participants():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = MentorshipMatch(mentor_user_id=mentor_id, mentee_user_id=mentee_id)

    class _Session:
        def get(self, _model, _match_id):
            return match

    assert participant_match(_Session(), match.id, mentor_id) is match
    assert participant_match(_Session(), match.id, mentee_id) is match
    with pytest.raises(LookupError):
        participant_match(_Session(), match.id, uuid4())


def test_student_cannot_access_mentorship_admin_endpoints():
    student = User(
        id=uuid4(),
        firebase_uid="mentorship-test-student",
        email="student@example.net",
        full_name="Chemistry Student",
        role="student",
    )
    app.dependency_overrides[get_current_user] = lambda: student
    app.dependency_overrides[get_db] = lambda: object()
    try:
        with TestClient(app) as client:
            response = client.get("/api/mentorship/admin/analytics")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)


class _FakeQuery:
    def __init__(self, session, model):
        self.session = session
        self.model = model
        self.filters = {}

    def filter_by(self, **filters):
        self.filters.update(filters)
        return self

    def filter(self, *_expressions):
        return self

    def order_by(self, *_expressions):
        return self

    def with_for_update(self):
        return self

    def first(self):
        records = self.session.records.get(self.model, [])
        return next(
            (record for record in records if all(getattr(record, key) == value for key, value in self.filters.items())),
            None,
        )

    def count(self):
        records = self.session.records.get(self.model, [])
        return sum(
            all(getattr(record, key) == value for key, value in self.filters.items())
            for record in records
        )


class _WorkflowSession:
    def __init__(self, *records):
        self.records = {}
        self.added = []
        self.commits = 0
        self.rollbacks = 0
        self.users = {}
        for record in records:
            self.records.setdefault(type(record), []).append(record)

    def query(self, model):
        return _FakeQuery(self, model)

    def get(self, model, item_id):
        if model is User:
            return self.users.get(item_id)
        return next(
            (record for record in self.records.get(model, []) if getattr(record, "id", None) == item_id),
            None,
        )

    def add(self, item):
        if getattr(item, "id", None) is None:
            item.id = uuid4()
        if isinstance(item, MentorshipGoal):
            item.status = item.status or "active"
            item.created_at = item.created_at or datetime.now(timezone.utc)
        self.records.setdefault(type(item), []).append(item)
        self.added.append(item)

    def flush(self):
        return None

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def refresh(self, _item):
        return None


def _active_match(mentor_id, mentee_id):
    return MentorshipMatch(
        id=uuid4(),
        mentor_user_id=mentor_id,
        mentee_user_id=mentee_id,
        mentee_application_id=uuid4(),
        status="active",
        match_score=80,
        shared_subjects=["Organic Chemistry"],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_participants_complete_session_and_duplicate_confirmation_is_rejected():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    study_session = MentorshipSession(
        id=uuid4(),
        match_id=match.id,
        created_by_id=mentor_id,
        submission_key=uuid4(),
        session_date=datetime.now(timezone.utc).date(),
        topic="Organic chemistry",
        status="awaiting_confirmation",
        mentor_confirmed_at=datetime.now(timezone.utc),
    )
    session = _WorkflowSession(match, study_session)

    response = mentorship_router.confirm_session(match.id, study_session.id, session, User(id=mentee_id, role="student"))
    assert response == {"status": "completed"}
    assert study_session.mentee_confirmed_at is not None
    assert study_session.completed_at is not None
    assert session.commits == 1
    assert len([item for item in session.added if isinstance(item, Notification)]) == 2

    with pytest.raises(Exception) as error:
        mentorship_router.confirm_session(match.id, study_session.id, session, User(id=mentee_id, role="student"))
    assert getattr(error.value, "status_code", None) == 409


def test_goal_creation_and_completion_are_audited_and_idempotent():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    session = _WorkflowSession(match)
    mentor = User(id=mentor_id, role="student")

    created = mentorship_router.create_goal(match.id, GoalCreate(title="Review reaction mechanisms"), session, mentor)
    goal = session.records[MentorshipGoal][0]
    assert created.title == goal.title
    assert session.commits == 1

    result = mentorship_router.complete_goal(match.id, goal.id, session, mentor)
    assert result == {"status": "completed"}
    assert goal.completed_at is not None
    assert session.commits == 2
    with pytest.raises(Exception) as error:
        mentorship_router.complete_goal(match.id, goal.id, session, mentor)
    assert getattr(error.value, "status_code", None) == 409


def test_nonparticipant_cannot_update_goal_or_session():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    session = _WorkflowSession(match)
    stranger = User(id=uuid4(), role="student")
    with pytest.raises(Exception) as goal_error:
        mentorship_router.create_goal(match.id, GoalCreate(title="Study"), session, stranger)
    with pytest.raises(Exception) as session_error:
        mentorship_router.create_session(
            match.id,
            SessionCreate(submission_key=uuid4(), session_date=datetime.now(timezone.utc).date(), topic="Study"),
            session,
            stranger,
        )
    assert getattr(goal_error.value, "status_code", None) == 404
    assert getattr(session_error.value, "status_code", None) == 404


def test_completion_requires_both_participants_and_keeps_history():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    application = MenteeApplication(id=match.mentee_application_id, user_id=mentee_id, status="matched")
    session = _WorkflowSession(match, application)

    first = mentorship_router.confirm_completion(
        match.id, CompletionCreate(feedback="Useful sessions"), session, User(id=mentor_id, role="student"),
    )
    assert first == {"status": "active", "completion_pending": True}
    assert match.status == "active"
    assert match.mentor_completed_at is not None

    second = mentorship_router.confirm_completion(
        match.id, CompletionCreate(feedback=None), session, User(id=mentee_id, role="student"),
    )
    assert second == {"status": "completed", "completion_pending": False}
    assert application.status == "completed"
    assert len(session.records[MentorshipFeedback]) == 2
    assert session.commits == 2

    with pytest.raises(Exception) as error:
        mentorship_router.confirm_completion(
            match.id, CompletionCreate(), session, User(id=mentor_id, role="student"),
        )
    assert getattr(error.value, "status_code", None) == 409


def test_approved_reassignment_archives_match_and_requeues_mentee(monkeypatch):
    mentor_id, mentee_id, admin_id = uuid4(), uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    request = MentorshipReassignmentRequest(
        id=uuid4(),
        match_id=match.id,
        requester_user_id=mentee_id,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    application = MenteeApplication(id=match.mentee_application_id, user_id=mentee_id, status="matched")
    session = _WorkflowSession(request, match, application)
    monkeypatch.setattr(mentorship_router, "match_waiting_mentees", lambda *_args: [])

    result = mentorship_router.review_reassignment_request(
        request.id, ReassignmentDecision(resolution_note="Scheduling conflict"),
        session, User(id=admin_id, role="admin"), "approved",
    )
    assert result == {"status": "approved"}
    assert request.resolved_by_id == admin_id
    assert request.resolved_at is not None
    assert match.status == "reassigned"
    assert application.status == "waiting"
    assert session.commits == 1


def test_analytics_returns_programme_counts_and_twelve_month_trend():
    now = datetime.now(timezone.utc)
    this_month = now.replace(day=1)

    class _AnalyticsQuery:
        def __init__(self, entity, ordinal):
            self.entity = entity
            self.ordinal = ordinal

        def filter(self, *_expressions):
            return self

        def scalar(self):
            return {
                ("count(mentor_applications.id)", 0): 3,
                ("count(distinct(mentee_applications.user_id))", 0): 11,
                ("count(mentor_applications.id)", 1): 2,
                ("count(mentorship_matches.id)", 0): 4,
                ("count(mentee_applications.id)", 0): 5,
                ("count(mentorship_matches.id)", 1): 2,
                ("count(mentorship_sessions.id)", 0): 17,
            }[(self.entity, self.ordinal)]

        def order_by(self, *_expressions):
            return self

        def all(self):
            return [(this_month,)]

    class _AnalyticsSession:
        def __init__(self):
            self.counts = {}

        def query(self, *entities):
            entity = str(entities[0])
            ordinal = self.counts.get(entity, 0)
            self.counts[entity] = ordinal + 1
            return _AnalyticsQuery(entity, ordinal)

    result = mentorship_router.mentorship_analytics(_AnalyticsSession(), User(id=uuid4(), role="admin"))
    assert result["total_mentors"] == 3
    assert result["total_mentees"] == 11
    assert result["pending_applications"] == 2
    assert result["active_matches"] == 4
    assert result["waiting_list"] == 5
    assert result["completed_mentorships"] == 2
    assert result["completed_sessions"] == 17
    assert len(result["trends"]) == 12
    assert result["trends"][-1]["matches"] == 1
