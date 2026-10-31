from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..models import Notification
from ..mentorship_models import (
    MentorApplication,
    MenteeApplication,
    MentorshipAudit,
    MentorshipGoal,
    MentorshipMatch,
    MentorshipNotificationPreference,
)

LEVEL_RANK = {"100": 100, "200": 200, "300": 300, "400": 400, "postgraduate": 500}
OPEN_MATCH_STATUSES = ("proposed", "active")


def audit(
    session: Session,
    *,
    actor_id: UUID | None,
    event_type: str,
    outcome: str,
    subject_id: UUID | None = None,
    match_id: UUID | None = None,
    details: str | None = None,
) -> None:
    session.add(
        MentorshipAudit(
            actor_user_id=actor_id,
            subject_user_id=subject_id,
            match_id=match_id,
            event_type=event_type,
            outcome=outcome,
            details=details,
        )
    )


def notify_user(
    session: Session,
    *,
    recipient_id: UUID,
    actor_id: UUID,
    title: str,
    message: str,
) -> None:
    preferences = session.get(MentorshipNotificationPreference, recipient_id)
    if preferences and not preferences.in_app_enabled:
        return
    session.add(
        Notification(
            title=title,
            message=message,
            category="mentorship",
            priority="normal",
            audience_type="individual",
            target_user_id=recipient_id,
            destination_path="/mentorship",
            status="published",
            published_at=datetime.now(timezone.utc),
            created_by_id=actor_id,
        )
    )


def compatibility_score(
    mentor: MentorApplication,
    mentee: MenteeApplication,
    active_capacity: int,
) -> tuple[int, list[str]] | None:
    mentee_subjects = {value.casefold(): value for value in mentee.subjects}
    mentor_subjects = {value.casefold() for value in mentor.subjects}
    shared = [value for key, value in mentee_subjects.items() if key in mentor_subjects]
    if not shared:
        return None

    mentor_rank = LEVEL_RANK[mentor.academic_level]
    mentee_rank = LEVEL_RANK[mentee.academic_level]
    if mentor_rank < mentee_rank or (mentor_rank == mentee_rank and mentee.academic_level != "postgraduate"):
        return None
    if active_capacity >= mentor.preferred_capacity:
        return None

    shared_slots = {value.casefold() for value in mentee.availability} & {
        value.casefold() for value in mentor.availability
    }
    subject_score = 40 * len(shared) / len(mentee_subjects)
    level_gap = max(0, mentor_rank - mentee_rank - 100)
    level_score = max(0, 25 - (level_gap // 100) * 5)
    availability_score = 20 * len(shared_slots) / len(mentee.availability)
    capacity_score = 15 * (mentor.preferred_capacity - active_capacity) / mentor.preferred_capacity
    return round(subject_score + level_score + availability_score + capacity_score), shared


def match_waiting_mentees(session: Session, actor_id: UUID) -> list[MentorshipMatch]:
    # Lock eligible mentor rows in one stable order so concurrent matching cannot
    # allocate the same final capacity slot twice.
    mentors = (
        session.query(MentorApplication)
        .filter(MentorApplication.status == "approved")
        .order_by(MentorApplication.created_at.asc(), MentorApplication.user_id.asc())
        .with_for_update()
        .all()
    )
    if not mentors:
        return []
    waiting = (
        session.query(MenteeApplication)
        .filter(MenteeApplication.status == "waiting")
        .order_by(MenteeApplication.created_at.asc(), MenteeApplication.id.asc())
        .with_for_update()
        .all()
    )
    if not waiting:
        return []

    created: list[MentorshipMatch] = []
    capacity_counts = {mentor.user_id: 0 for mentor in mentors}
    for mentor_id, count in (
        session.query(MentorshipMatch.mentor_user_id, func.count(MentorshipMatch.id))
        .filter(
            MentorshipMatch.mentor_user_id.in_(capacity_counts),
            MentorshipMatch.status.in_(OPEN_MATCH_STATUSES),
        )
        .group_by(MentorshipMatch.mentor_user_id)
        .all()
    ):
        capacity_counts[mentor_id] = count

    waiting_ids = [application.id for application in waiting]
    excluded_by_application: dict[UUID, set[UUID]] = {application_id: set() for application_id in waiting_ids}
    for application_id, mentor_id in (
        session.query(MentorshipMatch.mentee_application_id, MentorshipMatch.mentor_user_id)
        .filter(
            MentorshipMatch.mentee_application_id.in_(waiting_ids),
            MentorshipMatch.status.in_(("declined", "withdrawn", "reassigned", "expired")),
        )
        .all()
    ):
        excluded_by_application[application_id].add(mentor_id)

    for application in waiting:
        excluded_mentors = excluded_by_application[application.id]
        candidates: list[tuple[int, datetime, str, MentorApplication, list[str]]] = []
        for mentor in mentors:
            if mentor.user_id == application.user_id or mentor.user_id in excluded_mentors:
                continue
            result = compatibility_score(mentor, application, capacity_counts[mentor.user_id])
            if result is not None:
                score, subjects = result
                candidates.append((score, mentor.created_at, str(mentor.user_id), mentor, subjects))
        if not candidates:
            continue

        score, _, _, selected, subjects = min(candidates, key=lambda row: (-row[0], row[1], row[2]))
        match = MentorshipMatch(
            mentor_user_id=selected.user_id,
            mentee_user_id=application.user_id,
            mentee_application_id=application.id,
            status="proposed",
            match_score=score,
            shared_subjects=subjects,
        )
        session.add(match)
        session.flush()
        for goal_title in application.learning_goals:
            session.add(
                MentorshipGoal(
                    match_id=match.id,
                    created_by_id=application.user_id,
                    title=goal_title,
                )
            )
        application.status = "matched"
        capacity_counts[selected.user_id] += 1
        audit(
            session,
            actor_id=actor_id,
            subject_id=application.user_id,
            match_id=match.id,
            event_type="match_proposed",
            outcome="proposed",
            details=f"Compatibility score {score}.",
        )
        notify_user(
            session,
            recipient_id=selected.user_id,
            actor_id=actor_id,
            title="New mentorship match proposal",
            message="A student has been matched with you. Review the proposal in Mentorship Programme.",
        )
        notify_user(
            session,
            recipient_id=application.user_id,
            actor_id=actor_id,
            title="Mentorship match proposal",
            message="A mentor match proposal is ready. Review it in Mentorship Programme.",
        )
        created.append(match)
    return created


def expire_stale_proposals(session: Session, actor_id: UUID) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    expired = (
        session.query(MentorshipMatch)
        .filter(
            MentorshipMatch.status == "proposed",
            MentorshipMatch.created_at < cutoff,
            or_(
                MentorshipMatch.mentor_user_id == actor_id,
                MentorshipMatch.mentee_user_id == actor_id,
            ),
        )
        .order_by(MentorshipMatch.created_at.asc())
        .with_for_update()
        .all()
    )
    for match in expired:
        match.status = "expired"
        application = session.get(MenteeApplication, match.mentee_application_id)
        if application:
            application.status = "waiting"
        audit(
            session,
            actor_id=actor_id,
            subject_id=match.mentee_user_id,
            match_id=match.id,
            event_type="match_decision",
            outcome="expired",
        )
        for participant_id in match_participant_ids(match):
            notify_user(
                session,
                recipient_id=participant_id,
                actor_id=actor_id,
                title="Mentorship proposal expired",
                message="The match proposal expired without both responses. The programme will look for another suitable match.",
            )
    return len(expired)


def participant_match(session: Session, match_id: UUID, user_id: UUID) -> MentorshipMatch:
    match = session.get(MentorshipMatch, match_id)
    if not match or user_id not in {match.mentor_user_id, match.mentee_user_id}:
        raise LookupError("Mentorship record not found.")
    return match


def match_participant_ids(match: MentorshipMatch) -> tuple[UUID, UUID]:
    return match.mentor_user_id, match.mentee_user_id


def refresh_match_timestamp(match: MentorshipMatch) -> None:
    match.updated_at = datetime.now(timezone.utc)
