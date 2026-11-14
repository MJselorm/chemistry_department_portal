from datetime import datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.config import Settings
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
from app.services.mentorship import compatibility_details, compatibility_score, notify_user, participant_match, rank_mentor_candidates


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


def test_compatibility_ranks_preferences_and_explains_score():
    preferred_mentor = _mentor(capacity=2)
    preferred_mentor.programme = "BSc Chemistry"
    preferred_mentor.areas_of_expertise = ["reaction mechanisms", "organic chemistry"]
    preferred_mentor.mentorship_goals = ["understand reaction mechanisms"]
    preferred_mentor.teaching_style = "guided_practice"
    preferred_mentor.communication_method = "video_call"
    preferred_mentee = _mentee()
    preferred_mentee.programme = "BSc Chemistry"
    preferred_mentee.interests = ["reaction mechanisms"]
    preferred_mentee.learning_difficulties = ["reaction mechanisms"]
    preferred_mentee.learning_style = "guided_practice"
    preferred_mentee.communication_method = "video_call"

    alternate_mentor = _mentor(capacity=2)
    alternate_mentor.programme = "BSc Biochemistry"
    alternate_mentor.areas_of_expertise = ["spectroscopy"]
    alternate_mentor.mentorship_goals = ["laboratory safety"]
    alternate_mentor.teaching_style = "discussion"
    alternate_mentor.communication_method = "email"

    preferred = compatibility_details(preferred_mentor, preferred_mentee, active_capacity=0)
    alternate = compatibility_details(alternate_mentor, preferred_mentee, active_capacity=0)
    assert preferred is not None and alternate is not None
    assert preferred["score"] > alternate["score"]
    assert {factor["factor"] for factor in preferred["score_breakdown"]} >= {
        "subjects", "expertise_and_interests", "goals", "availability", "programme", "learning_style", "communication",
    }


def test_compatibility_weights_are_configurable():
    result = compatibility_details(
        _mentor(),
        _mentee(),
        active_capacity=0,
        weights={
            "subjects": 100,
            "expertise_and_interests": 0,
            "goals": 0,
            "availability": 0,
            "programme": 0,
            "learning_style": 0,
            "communication": 0,
            "preferences": 0,
            "capacity": 0,
        },
    )
    assert result is not None
    assert result["score"] == 100
    assert [factor["factor"] for factor in result["score_breakdown"]] == ["subjects"]


def test_candidate_ranking_prioritizes_fit_and_excludes_full_capacity():
    mentee = _mentee()
    mentee.programme = "BSc Chemistry"
    mentee.learning_style = "guided_practice"
    mentee.communication_method = "video_call"
    mentee.interests = ["reaction mechanisms"]
    mentee.learning_difficulties = ["reaction mechanisms"]

    weaker = _mentor(capacity=2)
    weaker.programme = "BSc Biochemistry"
    weaker.areas_of_expertise = ["spectroscopy"]
    weaker.mentorship_goals = ["laboratory safety"]
    weaker.teaching_style = "discussion"
    weaker.communication_method = "email"
    stronger = _mentor(capacity=2)
    stronger.programme = "BSc Chemistry"
    stronger.areas_of_expertise = ["reaction mechanisms"]
    stronger.mentorship_goals = ["reaction mechanisms"]
    stronger.teaching_style = "guided_practice"
    stronger.communication_method = "video_call"
    full = _mentor(capacity=1)

    ranked = rank_mentor_candidates(
        [weaker, full, stronger],
        mentee,
        {weaker.user_id: 0, full.user_id: 1, stronger.user_id: 0},
    )
    assert [item[0] for item in ranked] == [stronger, weaker]


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
    mentor = MentorApplicationCreate(
        academic_level="300",
        programme="  BSc   Chemistry ",
        subjects=["Organic Chemistry"],
        areas_of_expertise=["  Reaction mechanisms "],
        mentorship_goals=["Help students build confidence"],
        availability=["Saturday mornings"],
        teaching_style="guided_practice",
        communication_method="video_call",
        experience="  Peer tutor ",
    )
    assert mentor.programme == "BSc Chemistry"
    assert mentor.areas_of_expertise == ["Reaction mechanisms"]
    assert mentor.experience == "Peer tutor"
    mentee = MenteeApplicationCreate(
        academic_level="100",
        programme="BSc Chemistry",
        subjects=["Organic Chemistry"],
        interests=[],
        learning_difficulties=["Reaction mechanisms"],
        learning_goals=["Understand reaction mechanisms"],
        availability=["Saturday mornings"],
        learning_style="guided_practice",
        communication_method="video_call",
    )
    assert mentee.interests == []
    assert mentee.learning_difficulties == ["Reaction mechanisms"]
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


def test_match_serialization_batches_lookups_for_multiple_matches():
    mentee_id = uuid4()
    mentors = [
        MentorApplication(
            id=uuid4(), user_id=uuid4(), academic_level="200", subjects=["Chemistry"],
            availability=["Weekends"], status="approved",
        )
        for _ in range(2)
    ]
    applications = [
        MenteeApplication(
            id=uuid4(), user_id=mentee_id, academic_level="100", subjects=["Chemistry"],
            learning_goals=["Build confidence"], availability=["Weekends"], status="matched",
        )
        for _ in range(2)
    ]
    users = [
        User(id=mentee_id, firebase_uid="serialization-mentee", email="mentee@example.net", full_name="Mentee", role="student"),
        *[
            User(
                id=mentor.user_id,
                firebase_uid=f"serialization-mentor-{index}",
                email=f"mentor-{index}@example.net",
                full_name=f"Mentor {index}",
                role="student",
            )
            for index, mentor in enumerate(mentors)
        ],
    ]
    matches = [
        MentorshipMatch(
            id=uuid4(), mentor_user_id=mentor.user_id, mentee_user_id=mentee_id,
            mentee_application_id=application.id, status="proposed", match_score=80,
            score_breakdown={}, shared_subjects=["Chemistry"],
        )
        for mentor, application in zip(mentors, applications)
    ]

    class _Query:
        def __init__(self, session, model):
            self.session = session
            self.model = model

        def filter(self, *_expressions):
            return self

        def all(self):
            return self.session.records.get(self.model, [])

    class _Session:
        def __init__(self):
            self.records = {User: users, MentorApplication: mentors, MenteeApplication: applications}
            self.queries = []

        def query(self, model):
            self.queries.append(model)
            return _Query(self, model)

    session = _Session()
    serialized = mentorship_router._serialize_matches(session, matches, mentee_id)

    assert len(serialized) == 2
    assert [item["partner"]["name"] for item in serialized] == ["Mentor 0", "Mentor 1"]
    assert session.queries == [User, MentorApplication, MenteeApplication]


@pytest.mark.parametrize("database_url", [
    "postgres://user:password@db.example.test:5432/chemistry",
    "postgresql://user:password@db.example.test:5432/chemistry",
])
def test_postgres_urls_use_installed_psycopg_driver(database_url):
    assert Settings(database_url=database_url).database_url.startswith("postgresql+psycopg://")


def test_production_settings_reject_sqlite_fallback():
    with pytest.raises(ValueError, match="Production requires DATABASE_URL"):
        Settings(app_env="production", database_url="sqlite:///./chemistry_hub.db")


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

    def all(self):
        records = self.session.records.get(self.model, [])
        return [
            record
            for record in records
            if all(getattr(record, key) == value for key, value in self.filters.items())
        ]


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


def test_match_proposal_requires_both_acceptances_and_can_be_declined():
    mentor_id, mentee_id = uuid4(), uuid4()
    match = _active_match(mentor_id, mentee_id)
    match.status = "proposed"
    match.mentor_accepted_at = None
    match.mentee_accepted_at = None
    application = MenteeApplication(id=match.mentee_application_id, user_id=mentee_id, status="matched")
    session = _WorkflowSession(match, application)

    mentor_response = mentorship_router.decide_match(
        match.id,
        mentorship_router.MatchDecision(decision="accept"),
        session,
        User(id=mentor_id, role="student"),
    )
    assert mentor_response == {"status": "proposed"}
    assert match.mentor_accepted_at is not None
    assert match.mentee_accepted_at is None

    mentee_response = mentorship_router.decide_match(
        match.id,
        mentorship_router.MatchDecision(decision="accept"),
        session,
        User(id=mentee_id, role="student"),
    )
    assert mentee_response == {"status": "active"}
    assert match.status == "active"
    with pytest.raises(Exception) as duplicate:
        mentorship_router.decide_match(
            match.id,
            mentorship_router.MatchDecision(decision="accept"),
            session,
            User(id=mentee_id, role="student"),
        )
    assert getattr(duplicate.value, "status_code", None) == 409

    declined_match = _active_match(uuid4(), uuid4())
    declined_match.status = "proposed"
    declined_application = MenteeApplication(
        id=declined_match.mentee_application_id,
        user_id=declined_match.mentee_user_id,
        status="matched",
    )
    declined_session = _WorkflowSession(declined_match, declined_application)
    declined = mentorship_router.decide_match(
        declined_match.id,
        mentorship_router.MatchDecision(decision="decline"),
        declined_session,
        User(id=declined_match.mentor_user_id, role="student"),
    )
    assert declined == {"status": "declined"}
    assert declined_application.status == "waiting"


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


def test_application_routes_persist_preferences_and_trigger_matching(monkeypatch):
    user = User(id=uuid4(), firebase_uid="preferences-test", email="student@example.net", role="student")
    mentor_payload = MentorApplicationCreate(
        academic_level="300",
        programme="BSc Chemistry",
        subjects=["Organic Chemistry"],
        areas_of_expertise=["Reaction mechanisms"],
        mentorship_goals=["Build confidence in organic chemistry"],
        availability=["Saturday mornings"],
        teaching_style="guided_practice",
        communication_method="video_call",
        experience="Peer tutoring",
    )
    mentor_session = _WorkflowSession()
    mentor_result = mentorship_router.create_mentor_application(mentor_payload, mentor_session, user)
    mentor = mentor_session.records[MentorApplication][0]
    assert mentor_result["status"] == "pending"
    assert mentor.programme == "BSc Chemistry"
    assert mentor.areas_of_expertise == ["Reaction mechanisms"]
    assert mentor.teaching_style == "guided_practice"
    assert mentor.communication_method == "video_call"
    assert mentor.experience == "Peer tutoring"

    mentee_payload = MenteeApplicationCreate(
        academic_level="100",
        programme="BSc Chemistry",
        subjects=["Organic Chemistry"],
        interests=["Reaction mechanisms"],
        learning_difficulties=["Reaction mechanisms"],
        learning_goals=["Build confidence in organic chemistry"],
        availability=["Saturday mornings"],
        learning_style="guided_practice",
        communication_method="video_call",
        preferences="Worked examples",
    )
    mentee_session = _WorkflowSession()
    matched = []
    monkeypatch.setattr(mentorship_router, "match_waiting_mentees", lambda session, actor_id: matched.append((session, actor_id)))
    mentee_result = mentorship_router.create_mentee_application(mentee_payload, mentee_session, user)
    mentee = mentee_session.records[MenteeApplication][0]
    assert mentee_result["status"] == "waiting"
    assert mentee.programme == "BSc Chemistry"
    assert mentee.interests == ["Reaction mechanisms"]
    assert mentee.learning_difficulties == ["Reaction mechanisms"]
    assert mentee.learning_style == "guided_practice"
    assert mentee.communication_method == "video_call"
    assert matched == [(mentee_session, user.id)]


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
    mentor_ids = [uuid4(), uuid4(), uuid4()]

    class _AnalyticsQuery:
        def __init__(self, entity, ordinal):
            self.entity = entity
            self.ordinal = ordinal

        def filter(self, *_expressions):
            return self

        def scalar(self):
            return {
                ("count(mentor_applications.id)", 0): 5,
                ("count(mentor_applications.id)", 1): 3,
                ("count(distinct(mentee_applications.user_id))", 0): 11,
                ("count(mentor_applications.id)", 2): 2,
                ("count(mentorship_matches.id)", 0): 3,
                ("count(mentee_applications.id)", 0): 5,
                ("count(mentorship_matches.id)", 1): 4,
                ("count(mentorship_matches.id)", 2): 2,
                ("count(mentorship_matches.id)", 3): 10,
                ("count(mentorship_sessions.id)", 0): 17,
                ("count(mentorship_reassignment_requests.id)", 0): 2,
            }[(self.entity, self.ordinal)]

        def order_by(self, *_expressions):
            return self

        def distinct(self):
            return self

        def all(self):
            if self.entity == "MentorApplication.user_id":
                return [(mentor_id,) for mentor_id in mentor_ids]
            if self.entity == "MentorshipMatch.mentor_user_id":
                return [(mentor_ids[0],), (mentor_ids[1],)]
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
    assert result["total_mentors"] == 5
    assert result["approved_mentors"] == 3
    assert result["total_mentees"] == 11
    assert result["pending_applications"] == 2
    assert result["pending_mentors"] == 2
    assert result["pending_match_requests"] == 3
    assert result["active_matches"] == 4
    assert result["waiting_list"] == 5
    assert result["completed_mentorships"] == 2
    assert result["completed_sessions"] == 17
    assert result["pending_reassignment_requests"] == 2
    assert result["unmatched_mentors"] == 1
    assert result["unmatched_participants"] == 6
    assert result["successful_match_rate"] == 60
    assert len(result["trends"]) == 12
    assert result["trends"][-1]["matches"] == 1
