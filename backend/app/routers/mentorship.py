from calendar import month_abbr
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..mentorship_models import (
    MentorApplication,
    MenteeApplication,
    MentorshipFeedback,
    MentorshipGoal,
    MentorshipMatch,
    MentorshipNotificationPreference,
    MentorshipProgressNote,
    MentorshipReassignmentRequest,
    MentorshipSession,
)
from ..mentorship_schemas import (
    CompletionCreate,
    GoalCreate,
    MentorApplicationCreate,
    MentorApplicationDecision,
    MenteeApplicationCreate,
    MatchDecision,
    MentorshipGoalOut,
    MentorshipSessionOut,
    NotificationPreferenceUpdate,
    ProgressNoteCreate,
    ReassignmentCreate,
    ReassignmentDecision,
    SessionCreate,
)
from ..models import User
from ..rate_limit import MENTORSHIP_ACTION_LIMIT, MENTORSHIP_APPLICATION_LIMIT
from ..security import get_current_user, require_admin
from ..services.mentorship import (
    audit,
    expire_stale_proposals,
    match_participant_ids,
    match_waiting_mentees,
    notify_user,
    refresh_match_timestamp,
)

router = APIRouter(prefix="/api/mentorship", tags=["mentorship"])
DB = Annotated[Session, Depends(get_db)]
Auth = Annotated[User, Depends(get_current_user)]
Admin = Annotated[User, Depends(require_admin)]
ACTIVE_MATCHES = ("proposed", "active")


def _commit(session: Session, message: str) -> None:
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, message) from exc


def _require_student(user: User) -> None:
    if user.role != "student":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only student accounts can apply to the mentorship programme.")


def _lock_participant_match(session: Session, match_id: UUID, user_id: UUID) -> MentorshipMatch:
    match = session.query(MentorshipMatch).filter_by(id=match_id).with_for_update().first()
    if not match or user_id not in {match.mentor_user_id, match.mentee_user_id}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentorship record not found.")
    return match


def _ensure_progress_open(match: MentorshipMatch) -> None:
    if match.mentor_completed_at or match.mentee_completed_at:
        raise HTTPException(status.HTTP_409_CONFLICT, "Progress is locked while completion is being confirmed.")


def _user_summary(session: Session, user_id: UUID, *, include_email: bool = False) -> dict:
    user = session.get(User, user_id)
    if not user:
        return {"id": user_id, "name": "Participant"}
    result = {"id": user.id, "name": user.full_name or "Chemistry student"}
    if include_email:
        result["email"] = user.email
    return result


def _serialize_match(session: Session, match: MentorshipMatch, viewer_id: UUID) -> dict:
    is_mentor = match.mentor_user_id == viewer_id
    partner_id = match.mentee_user_id if is_mentor else match.mentor_user_id
    reveal_contact = match.status in {"active", "completed"}
    reveal_progress = match.status in {"active", "completed", "withdrawn", "reassigned"}
    mentor = session.query(MentorApplication).filter_by(user_id=match.mentor_user_id).first()
    mentee_application = session.get(MenteeApplication, match.mentee_application_id)
    goals = []
    notes = []
    sessions = []
    feedback = None
    if reveal_progress:
        goals = session.query(MentorshipGoal).filter_by(match_id=match.id).order_by(MentorshipGoal.created_at.asc()).all()
        notes = (
            session.query(MentorshipProgressNote)
            .filter_by(match_id=match.id)
            .order_by(MentorshipProgressNote.created_at.desc())
            .limit(50)
            .all()
        )
        sessions = (
            session.query(MentorshipSession)
            .filter_by(match_id=match.id)
            .order_by(MentorshipSession.session_date.desc(), MentorshipSession.created_at.desc())
            .limit(100)
            .all()
        )
        feedback = session.query(MentorshipFeedback).filter_by(match_id=match.id, author_user_id=viewer_id).first()
    return {
        "id": match.id,
        "status": match.status,
        "match_score": match.match_score,
        "shared_subjects": match.shared_subjects,
        "partner_role": "mentee" if is_mentor else "mentor",
        "partner": _user_summary(session, partner_id, include_email=reveal_contact),
        "partner_introduction": mentor.introduction if reveal_progress and not is_mentor and mentor else None,
        "learning_goals": mentee_application.learning_goals if reveal_progress and mentee_application else [],
        "availability": (
            {
                "mentor": mentor.availability if mentor else [],
                "mentee": mentee_application.availability if mentee_application else [],
            }
            if reveal_progress
            else None
        ),
        "mentor_accepted_at": match.mentor_accepted_at,
        "mentee_accepted_at": match.mentee_accepted_at,
        "my_accepted_at": match.mentor_accepted_at if is_mentor else match.mentee_accepted_at,
        "partner_accepted_at": match.mentee_accepted_at if is_mentor else match.mentor_accepted_at,
        "mentor_completed_at": match.mentor_completed_at,
        "mentee_completed_at": match.mentee_completed_at,
        "created_at": match.created_at,
        "updated_at": match.updated_at,
        "goals": [MentorshipGoalOut.model_validate(goal).model_dump(mode="json") for goal in goals],
        "progress_notes": [
            {"id": note.id, "author": _user_summary(session, note.author_user_id)["name"], "body": note.body, "created_at": note.created_at}
            for note in notes
        ],
        "sessions": [MentorshipSessionOut.model_validate(item).model_dump(mode="json") for item in sessions],
        "my_feedback": feedback.feedback if feedback else None,
    }


@router.get("/me")
def my_mentorship(session: DB, user: Auth):
    if expire_stale_proposals(session, user.id):
        match_waiting_mentees(session, user.id)
        _commit(session, "Unable to update expired match proposals.")
    mentor_application = session.query(MentorApplication).filter_by(user_id=user.id).first()
    mentee_application = (
        session.query(MenteeApplication)
        .filter_by(user_id=user.id)
        .order_by(MenteeApplication.created_at.desc())
        .first()
    )
    matches = (
        session.query(MentorshipMatch)
        .filter((MentorshipMatch.mentor_user_id == user.id) | (MentorshipMatch.mentee_user_id == user.id))
        .order_by(MentorshipMatch.created_at.desc())
        .limit(50)
        .all()
    )
    preference = session.get(MentorshipNotificationPreference, user.id)
    return {
        "mentor_application": (
            {
                "academic_level": mentor_application.academic_level,
                "subjects": mentor_application.subjects,
                "availability": mentor_application.availability,
                "preferred_capacity": mentor_application.preferred_capacity,
                "introduction": mentor_application.introduction,
                "status": mentor_application.status,
                "review_note": mentor_application.review_note,
            }
            if mentor_application
            else None
        ),
        "mentee_application": (
            {
                "academic_level": mentee_application.academic_level,
                "subjects": mentee_application.subjects,
                "learning_goals": mentee_application.learning_goals,
                "availability": mentee_application.availability,
                "preferences": mentee_application.preferences,
                "status": mentee_application.status,
                "created_at": mentee_application.created_at,
            }
            if mentee_application
            else None
        ),
        "matches": [_serialize_match(session, match, user.id) for match in matches],
        "notification_preferences": {"in_app_enabled": preference.in_app_enabled if preference else True},
    }


@router.post("/mentor-applications", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_APPLICATION_LIMIT)])
def create_mentor_application(payload: MentorApplicationCreate, session: DB, user: Auth):
    _require_student(user)
    application = session.query(MentorApplication).filter_by(user_id=user.id).with_for_update().first()
    if application and application.status != "rejected":
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an active mentor application.")
    if application:
        application.academic_level = payload.academic_level
        application.subjects = payload.subjects
        application.availability = payload.availability
        application.preferred_capacity = payload.preferred_capacity
        application.introduction = payload.introduction
        application.review_note = None
        application.reviewed_by_id = None
        application.status = "pending"
    else:
        application = MentorApplication(user_id=user.id, **payload.model_dump())
        session.add(application)
    audit(session, actor_id=user.id, subject_id=user.id, event_type="mentor_application", outcome="pending")
    _commit(session, "A mentor application already exists.")
    return {"application_id": application.id, "status": application.status}


@router.post("/mentee-applications", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_APPLICATION_LIMIT)])
def create_mentee_application(payload: MenteeApplicationCreate, session: DB, user: Auth):
    _require_student(user)
    existing = (
        session.query(MenteeApplication)
        .filter(
            MenteeApplication.user_id == user.id,
            MenteeApplication.status.in_(("waiting", "matched")),
        )
        .with_for_update()
        .first()
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have an active mentee application.")
    application = MenteeApplication(user_id=user.id, **payload.model_dump(), status="waiting")
    session.add(application)
    session.flush()
    audit(session, actor_id=user.id, subject_id=user.id, event_type="mentee_application", outcome="waiting")
    match_waiting_mentees(session, user.id)
    _commit(session, "An active mentee application already exists.")
    return {"application_id": application.id, "status": application.status}


@router.patch("/notification-preferences", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def update_notification_preferences(payload: NotificationPreferenceUpdate, session: DB, user: Auth):
    preference = session.get(MentorshipNotificationPreference, user.id)
    if not preference:
        preference = MentorshipNotificationPreference(user_id=user.id, in_app_enabled=payload.in_app_enabled)
        session.add(preference)
    else:
        preference.in_app_enabled = payload.in_app_enabled
    session.commit()
    return {"in_app_enabled": preference.in_app_enabled}


@router.post("/matches/{match_id}/decision", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def decide_match(match_id: UUID, payload: MatchDecision, session: DB, user: Auth):
    match = session.query(MentorshipMatch).filter_by(id=match_id).with_for_update().first()
    if not match or user.id not in {match.mentor_user_id, match.mentee_user_id}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentorship proposal not found.")
    if match.status != "proposed":
        raise HTTPException(status.HTTP_409_CONFLICT, "This match proposal is no longer pending.")

    now = datetime.now(timezone.utc)
    if match.created_at < now - timedelta(days=14):
        match.status = "expired"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "waiting"
        audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="match_decision", outcome="expired")
        for participant_id in match_participant_ids(match):
            notify_user(
                session,
                recipient_id=participant_id,
                actor_id=user.id,
                title="Mentorship proposal expired",
                message="The match proposal expired without both responses. The programme will look for another suitable match.",
            )
        match_waiting_mentees(session, user.id)
        _commit(session, "This match proposal has expired.")
        return {"status": "expired"}

    if payload.decision == "decline":
        match.status = "declined"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "waiting"
        audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="match_decision", outcome="declined")
        for participant_id in match_participant_ids(match):
            notify_user(session, recipient_id=participant_id, actor_id=user.id, title="Match proposal declined", message="A mentorship proposal was declined. The programme will look for another suitable match.")
        match_waiting_mentees(session, user.id)
        _commit(session, "This match proposal was already resolved.")
        return {"status": "declined"}

    if user.id == match.mentor_user_id:
        if match.mentor_accepted_at:
            raise HTTPException(status.HTTP_409_CONFLICT, "Your response has already been recorded.")
        match.mentor_accepted_at = now
    else:
        if match.mentee_accepted_at:
            raise HTTPException(status.HTTP_409_CONFLICT, "Your response has already been recorded.")
        match.mentee_accepted_at = now
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="match_decision", outcome="accepted")
    for participant_id in match_participant_ids(match):
        notify_user(
            session,
            recipient_id=participant_id,
            actor_id=user.id,
            title="Match proposal accepted",
            message="A participant accepted the mentorship proposal. The match becomes active after both accept.",
        )
    if match.mentor_accepted_at and match.mentee_accepted_at:
        match.status = "active"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "matched"
        for participant_id in match_participant_ids(match):
            notify_user(session, recipient_id=participant_id, actor_id=user.id, title="Mentorship confirmed", message="Both participants accepted. Your mentorship is now active.")
    _commit(session, "This match proposal was already resolved.")
    return {"status": match.status}


@router.post("/matches/{match_id}/goals", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def create_goal(match_id: UUID, payload: GoalCreate, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Goals can be added only to an active mentorship.")
    _ensure_progress_open(match)
    goal = MentorshipGoal(match_id=match.id, created_by_id=user.id, title=payload.title)
    session.add(goal)
    refresh_match_timestamp(match)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="goal_update", outcome="created")
    _commit(session, "Unable to save this goal.")
    session.refresh(goal)
    return MentorshipGoalOut.model_validate(goal)


@router.post("/matches/{match_id}/goals/{goal_id}/complete", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def complete_goal(match_id: UUID, goal_id: UUID, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Goals can be updated only during an active mentorship.")
    _ensure_progress_open(match)
    goal = session.query(MentorshipGoal).filter_by(id=goal_id, match_id=match.id).with_for_update().first()
    if not goal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Learning goal not found.")
    if goal.status == "completed":
        raise HTTPException(status.HTTP_409_CONFLICT, "This goal is already complete.")
    goal.status = "completed"
    goal.completed_at = datetime.now(timezone.utc)
    refresh_match_timestamp(match)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="goal_update", outcome="completed")
    _commit(session, "Unable to update this goal.")
    return {"status": "completed"}


@router.post("/matches/{match_id}/progress-notes", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def create_progress_note(match_id: UUID, payload: ProgressNoteCreate, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Progress notes can be added only to an active mentorship.")
    _ensure_progress_open(match)
    note = MentorshipProgressNote(match_id=match.id, author_user_id=user.id, body=payload.body)
    session.add(note)
    refresh_match_timestamp(match)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="progress_note", outcome="created")
    _commit(session, "Unable to save this progress note.")
    session.refresh(note)
    return {"id": note.id, "body": note.body, "created_at": note.created_at}


@router.post("/matches/{match_id}/sessions", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def create_session(match_id: UUID, payload: SessionCreate, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Sessions can be recorded only during an active mentorship.")
    _ensure_progress_open(match)
    if payload.session_date > datetime.now(timezone.utc).date():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "A completed study session cannot be dated in the future.")
    already_submitted = session.query(MentorshipSession).filter_by(
        match_id=match.id,
        submission_key=payload.submission_key,
    ).first()
    if already_submitted:
        raise HTTPException(status.HTTP_409_CONFLICT, "This session submission has already been recorded.")

    is_mentor = user.id == match.mentor_user_id
    study_session = MentorshipSession(
        match_id=match.id,
        created_by_id=user.id,
        submission_key=payload.submission_key,
        session_date=payload.session_date,
        topic=payload.topic,
        notes=payload.notes,
        mentor_confirmed_at=datetime.now(timezone.utc) if is_mentor else None,
        mentee_confirmed_at=None if is_mentor else datetime.now(timezone.utc),
    )
    session.add(study_session)
    refresh_match_timestamp(match)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="session_update", outcome="awaiting_confirmation")
    for participant_id in match_participant_ids(match):
        notify_user(session, recipient_id=participant_id, actor_id=user.id, title="Study session recorded", message="A study session was recorded and is awaiting the other participant's confirmation.")
    _commit(session, "This session submission has already been recorded.")
    session.refresh(study_session)
    return MentorshipSessionOut.model_validate(study_session)


@router.post("/matches/{match_id}/sessions/{session_id}/confirm", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def confirm_session(match_id: UUID, session_id: UUID, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Sessions can be confirmed only during an active mentorship.")
    study_session = (
        session.query(MentorshipSession)
        .filter_by(id=session_id, match_id=match.id)
        .with_for_update()
        .first()
    )
    if not study_session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found.")
    if study_session.status != "awaiting_confirmation":
        raise HTTPException(status.HTTP_409_CONFLICT, "This session is no longer awaiting confirmation.")
    now = datetime.now(timezone.utc)
    if user.id == match.mentor_user_id:
        if study_session.mentor_confirmed_at:
            raise HTTPException(status.HTTP_409_CONFLICT, "Your session confirmation has already been recorded.")
        study_session.mentor_confirmed_at = now
    else:
        if study_session.mentee_confirmed_at:
            raise HTTPException(status.HTTP_409_CONFLICT, "Your session confirmation has already been recorded.")
        study_session.mentee_confirmed_at = now
    if study_session.mentor_confirmed_at and study_session.mentee_confirmed_at:
        study_session.status = "completed"
        study_session.completed_at = now
        outcome = "completed"
    else:
        outcome = "confirmed"
    refresh_match_timestamp(match)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="session_update", outcome=outcome)
    for participant_id in match_participant_ids(match):
        notify_user(
            session,
            recipient_id=participant_id,
            actor_id=user.id,
            title="Study session completed" if outcome == "completed" else "Session confirmation received",
            message="Both participants confirmed this study session." if outcome == "completed" else "The other participant confirmed the study session.",
        )
    _commit(session, "This session has already been resolved.")
    return {"status": study_session.status}


@router.post("/matches/{match_id}/completion", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def confirm_completion(match_id: UUID, payload: CompletionCreate, session: DB, user: Auth):
    match = session.query(MentorshipMatch).filter_by(id=match_id).with_for_update().first()
    if not match or user.id not in {match.mentor_user_id, match.mentee_user_id}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentorship record not found.")
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only active mentorships can be completed.")
    pending_reassignment = session.query(MentorshipReassignmentRequest).filter_by(match_id=match.id, status="pending").first()
    if pending_reassignment:
        raise HTTPException(status.HTTP_409_CONFLICT, "Resolve the pending reassignment request before completing this mentorship.")
    unconfirmed_sessions = session.query(MentorshipSession).filter_by(
        match_id=match.id,
        status="awaiting_confirmation",
    ).count()
    if unconfirmed_sessions:
        raise HTTPException(status.HTTP_409_CONFLICT, "Confirm all recorded study sessions before completing the mentorship.")
    is_mentor = user.id == match.mentor_user_id
    if (match.mentor_completed_at if is_mentor else match.mentee_completed_at):
        raise HTTPException(status.HTTP_409_CONFLICT, "Your completion confirmation has already been recorded.")
    feedback = session.query(MentorshipFeedback).filter_by(match_id=match.id, author_user_id=user.id).first()
    if feedback:
        feedback.feedback = payload.feedback
    else:
        session.add(MentorshipFeedback(match_id=match.id, author_user_id=user.id, feedback=payload.feedback))
    now = datetime.now(timezone.utc)
    if is_mentor:
        match.mentor_completed_at = now
    else:
        match.mentee_completed_at = now
    refresh_match_timestamp(match)
    if match.mentor_completed_at and match.mentee_completed_at:
        match.status = "completed"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "completed"
        outcome = "completed"
        message = "Both participants marked the mentorship complete. It is now available in your history."
    else:
        outcome = "awaiting_participant"
        message = "Your completion confirmation was recorded. The other participant must also confirm."
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="completion", outcome=outcome)
    for participant_id in match_participant_ids(match):
        notify_user(session, recipient_id=participant_id, actor_id=user.id, title="Mentorship completion update", message=message)
    _commit(session, "This mentorship could not be completed.")
    return {"status": match.status, "completion_pending": match.status == "active"}


@router.post("/matches/{match_id}/withdraw", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def withdraw_match(match_id: UUID, session: DB, user: Auth):
    match = session.query(MentorshipMatch).filter_by(id=match_id).with_for_update().first()
    if not match or user.id not in {match.mentor_user_id, match.mentee_user_id}:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentorship record not found.")
    if match.status not in ACTIVE_MATCHES:
        raise HTTPException(status.HTTP_409_CONFLICT, "This mentorship can no longer be withdrawn.")
    pending_reassignment = session.query(MentorshipReassignmentRequest).filter_by(match_id=match.id, status="pending").first()
    if pending_reassignment:
        raise HTTPException(status.HTTP_409_CONFLICT, "Resolve the pending reassignment request before withdrawing.")
    _ensure_progress_open(match)
    match.status = "withdrawn"
    application = session.get(MenteeApplication, match.mentee_application_id)
    if application:
        application.status = "withdrawn" if user.id == match.mentee_user_id else "waiting"
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="withdrawal", outcome="withdrawn")
    for participant_id in match_participant_ids(match):
        notify_user(session, recipient_id=participant_id, actor_id=user.id, title="Mentorship withdrawn", message="A participant withdrew from this mentorship.")
    if user.id == match.mentor_user_id:
        match_waiting_mentees(session, user.id)
    _commit(session, "This mentorship can no longer be withdrawn.")
    return {"status": "withdrawn"}


@router.post("/matches/{match_id}/reassignment-requests", status_code=status.HTTP_201_CREATED, dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def request_reassignment(match_id: UUID, payload: ReassignmentCreate, session: DB, user: Auth):
    match = _lock_participant_match(session, match_id, user.id)
    if match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "Reassignment is available only for an active mentorship.")
    _ensure_progress_open(match)
    existing = session.query(MentorshipReassignmentRequest).filter_by(match_id=match.id, status="pending").first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A reassignment request is already pending.")
    request = MentorshipReassignmentRequest(match_id=match.id, requester_user_id=user.id, reason=payload.reason)
    session.add(request)
    audit(session, actor_id=user.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="reassignment_request", outcome="pending")
    for admin in session.query(User).filter(User.role.in_(("admin", "super_admin"))).all():
        notify_user(session, recipient_id=admin.id, actor_id=user.id, title="Mentorship reassignment requested", message="A participant requested help with an active mentorship.")
    _commit(session, "A reassignment request is already pending.")
    return {"id": request.id, "status": request.status}


@router.get("/admin/analytics")
def mentorship_analytics(session: DB, _: Admin):
    now = datetime.now(timezone.utc)
    period_start = (now.replace(day=1) - timedelta(days=365)).replace(day=1)
    total_mentors = session.query(func.count(MentorApplication.id)).filter(MentorApplication.status == "approved").scalar() or 0
    total_mentees = session.query(func.count(func.distinct(MenteeApplication.user_id))).scalar() or 0
    pending = session.query(func.count(MentorApplication.id)).filter(MentorApplication.status == "pending").scalar() or 0
    active = session.query(func.count(MentorshipMatch.id)).filter(MentorshipMatch.status == "active").scalar() or 0
    waiting = session.query(func.count(MenteeApplication.id)).filter(MenteeApplication.status == "waiting").scalar() or 0
    completed = session.query(func.count(MentorshipMatch.id)).filter(MentorshipMatch.status == "completed").scalar() or 0
    sessions_completed = session.query(func.count(MentorshipSession.id)).filter(MentorshipSession.status == "completed").scalar() or 0
    month_rows = (
        session.query(MentorshipMatch.created_at)
        .filter(MentorshipMatch.created_at >= period_start)
        .order_by(MentorshipMatch.created_at.asc())
        .all()
    )
    trend_counts: dict[str, int] = {}
    for (created_at,) in month_rows:
        month = created_at.strftime("%Y-%m")
        trend_counts[month] = trend_counts.get(month, 0) + 1
    trends = []
    current_month = now.year * 12 + now.month - 1
    for offset in range(11, -1, -1):
        year, month_index = divmod(current_month - offset, 12)
        month_date = now.replace(year=year, month=month_index + 1, day=1)
        key = month_date.strftime("%Y-%m")
        trends.append({"month": f"{month_abbr[month_date.month]} {month_date.year}", "matches": trend_counts.get(key, 0)})
    return {
        "total_mentors": total_mentors,
        "total_mentees": total_mentees,
        "pending_applications": pending,
        "active_matches": active,
        "waiting_list": waiting,
        "completed_mentorships": completed,
        "completed_sessions": sessions_completed,
        "trends": trends,
    }


@router.get("/admin/mentor-applications")
def admin_mentor_applications(
    session: DB,
    _: Admin,
    application_status: str = Query(default="pending", alias="status", pattern="^(pending|approved|rejected)$"),
):
    applications = (
        session.query(MentorApplication)
        .filter(MentorApplication.status == application_status)
        .order_by(MentorApplication.created_at.asc())
        .limit(200)
        .all()
    )
    return [
        {
            "id": item.id,
            "user": _user_summary(session, item.user_id, include_email=True),
            "academic_level": item.academic_level,
            "subjects": item.subjects,
            "availability": item.availability,
            "preferred_capacity": item.preferred_capacity,
            "introduction": item.introduction,
            "status": item.status,
            "review_note": item.review_note,
            "created_at": item.created_at,
        }
        for item in applications
    ]


@router.get("/admin/waiting-list")
def admin_waiting_list(session: DB, _: Admin):
    applications = (
        session.query(MenteeApplication)
        .filter(MenteeApplication.status == "waiting")
        .order_by(MenteeApplication.created_at.asc())
        .limit(250)
        .all()
    )
    return [
        {
            "id": item.id,
            "user": _user_summary(session, item.user_id),
            "academic_level": item.academic_level,
            "subjects": item.subjects,
            "availability": item.availability,
            "created_at": item.created_at,
        }
        for item in applications
    ]


@router.post("/admin/mentor-applications/{application_id}/decision", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def review_mentor_application(
    application_id: UUID,
    payload: MentorApplicationDecision,
    session: DB,
    admin: Admin,
):
    session.query(MentorApplication.id).order_by(
        MentorApplication.created_at.asc(),
        MentorApplication.user_id.asc(),
    ).with_for_update().all()
    application = session.query(MentorApplication).filter_by(id=application_id).with_for_update().first()
    if not application:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentor application not found.")
    if application.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, "This application has already been reviewed.")
    application.status = payload.decision
    application.reviewed_by_id = admin.id
    application.review_note = payload.note
    audit(session, actor_id=admin.id, subject_id=application.user_id, event_type="mentor_review", outcome=payload.decision, details=payload.note)
    notify_user(
        session,
        recipient_id=application.user_id,
        actor_id=admin.id,
        title=f"Mentor application {payload.decision}",
        message="Your mentor application was approved." if payload.decision == "approved" else "Your mentor application was not approved.",
    )
    if payload.decision == "approved":
        match_waiting_mentees(session, admin.id)
    _commit(session, "This application has already been reviewed.")
    return {"status": application.status, "review_note": application.review_note}


@router.get("/admin/matches")
def admin_matches(
    session: DB,
    _: Admin,
    match_status: str | None = Query(default=None, alias="status", pattern="^(proposed|active|completed|declined|withdrawn|reassigned|expired)$"),
    limit: int = Query(default=100, ge=1, le=250),
):
    query = session.query(MentorshipMatch)
    if match_status:
        query = query.filter(MentorshipMatch.status == match_status)
    matches = query.order_by(MentorshipMatch.created_at.desc()).limit(limit).all()
    inactive_before = datetime.now(timezone.utc) - timedelta(days=30)
    return [
        {
            "id": match.id,
            "status": match.status,
            "mentor": _user_summary(session, match.mentor_user_id),
            "mentee": _user_summary(session, match.mentee_user_id),
            "shared_subjects": match.shared_subjects,
            "created_at": match.created_at,
            "updated_at": match.updated_at,
            "inactive": match.status == "active" and match.updated_at < inactive_before,
        }
        for match in matches
    ]


@router.get("/admin/reassignment-requests")
def admin_reassignment_requests(
    session: DB,
    _: Admin,
    request_status: str = Query(default="pending", alias="status", pattern="^(pending|approved|rejected)$"),
):
    requests = (
        session.query(MentorshipReassignmentRequest)
        .filter(MentorshipReassignmentRequest.status == request_status)
        .order_by(MentorshipReassignmentRequest.created_at.asc())
        .limit(200)
        .all()
    )
    result = []
    for request in requests:
        match = session.get(MentorshipMatch, request.match_id)
        if not match:
            continue
        result.append(
            {
                "id": request.id,
                "match_id": match.id,
                "requester": _user_summary(session, request.requester_user_id),
                "mentor": _user_summary(session, match.mentor_user_id),
                "mentee": _user_summary(session, match.mentee_user_id),
                "reason": request.reason,
                "status": request.status,
                "created_at": request.created_at,
                "resolution_note": request.resolution_note,
            }
        )
    return result


@router.post("/admin/reassignment-requests/{request_id}/decision", dependencies=[Depends(MENTORSHIP_ACTION_LIMIT)])
def review_reassignment_request(
    request_id: UUID,
    payload: ReassignmentDecision,
    session: DB,
    admin: Admin,
    decision: str = Query(pattern="^(approved|rejected)$"),
):
    request = session.query(MentorshipReassignmentRequest).filter_by(id=request_id).with_for_update().first()
    if not request:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reassignment request not found.")
    if request.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, "This reassignment request has already been resolved.")
    match = session.query(MentorshipMatch).filter_by(id=request.match_id).with_for_update().first()
    if not match or match.status != "active":
        raise HTTPException(status.HTTP_409_CONFLICT, "The mentorship is no longer active.")
    request.status = decision
    request.resolved_by_id = admin.id
    request.resolution_note = payload.resolution_note
    request.resolved_at = datetime.now(timezone.utc)
    if decision == "approved":
        match.status = "reassigned"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "waiting"
        audit(session, actor_id=admin.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="reassignment_review", outcome="approved", details=payload.resolution_note)
        match_waiting_mentees(session, admin.id)
        outcome_message = "Your reassignment request was approved and the programme will seek another mentor."
    else:
        audit(session, actor_id=admin.id, subject_id=match.mentee_user_id, match_id=match.id, event_type="reassignment_review", outcome="rejected", details=payload.resolution_note)
        outcome_message = "Your reassignment request was reviewed and the current mentorship remains active."
    for participant_id in match_participant_ids(match):
        notify_user(session, recipient_id=participant_id, actor_id=admin.id, title=f"Reassignment request {decision}", message=outcome_message)
    _commit(session, "This reassignment request has already been resolved.")
    return {"status": request.status}
