from datetime import datetime, timedelta, timezone
from uuid import UUID
import re

from sqlalchemy import func, or_
from sqlalchemy.dialects.postgresql import insert as pg_insert
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
MATCH_SCORE_WEIGHTS = {
    "subjects": 30,
    "expertise_and_interests": 15,
    "goals": 15,
    "availability": 15,
    "programme": 5,
    "learning_style": 7,
    "communication": 3,
    "preferences": 5,
    "capacity": 5,
}


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
    event_key: str | None = None,
) -> None:
    preferences = session.get(MentorshipNotificationPreference, recipient_id)
    if preferences and not preferences.in_app_enabled:
        return
    values = dict(
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
        event_key=event_key,
    )
    if event_key:
        session.execute(pg_insert(Notification).values(**values).on_conflict_do_nothing(index_elements=[Notification.event_key]))
    else:
        session.add(Notification(**values))


def compatibility_score(
    mentor: MentorApplication,
    mentee: MenteeApplication,
    active_capacity: int,
) -> tuple[int, list[str]] | None:
    result = compatibility_details(mentor, mentee, active_capacity)
    if result is None:
        return None
    return result["score"], result["shared_subjects"]


def _normalized(values: list[str] | None) -> dict[str, str]:
    return {value.casefold(): value for value in (values or []) if value.strip()}


def _text_tokens(values: list[str] | None) -> set[str]:
    ignored = {"and", "for", "the", "with", "from", "into", "about", "understand", "improve", "learn"}
    return {
        token
        for value in (values or [])
        for token in re.findall(r"[a-z0-9]+", value.casefold())
        if len(token) > 2 and token not in ignored
    }


def _similarity(left: list[str] | None, right: list[str] | None) -> float:
    left_tokens, right_tokens = _text_tokens(left), _text_tokens(right)
    if not left_tokens or not right_tokens:
        return 0
    return len(left_tokens & right_tokens) / len(left_tokens)


def compatibility_details(
    mentor: MentorApplication,
    mentee: MenteeApplication,
    active_capacity: int,
    *,
    weights: dict[str, int] | None = None,
) -> dict | None:
    """Return a ranked compatibility score and the weighted factors behind it."""
    mentee_subjects = _normalized(mentee.subjects)
    mentor_subjects = _normalized(mentor.subjects)
    shared = [value for key, value in mentee_subjects.items() if key in mentor_subjects]
    mentor_rank = LEVEL_RANK[mentor.academic_level]
    mentee_rank = LEVEL_RANK[mentee.academic_level]
    if not shared or mentor_rank < mentee_rank or (mentor_rank == mentee_rank and mentee.academic_level != "postgraduate"):
        return None
    if active_capacity >= mentor.preferred_capacity:
        return None

    score_weights = weights or MATCH_SCORE_WEIGHTS
    if set(score_weights) != set(MATCH_SCORE_WEIGHTS):
        raise ValueError("Mentorship match weights must define every compatibility factor.")
    factors: dict[str, tuple[str, float | None]] = {
        "subjects": ("Subject coverage", len(shared) / max(1, len(mentee_subjects))),
        "expertise_and_interests": (
            "Expertise and interests",
            _similarity(
                [*(getattr(mentee, "interests", None) or []), *(getattr(mentee, "learning_difficulties", None) or [])],
                [*(getattr(mentor, "areas_of_expertise", None) or []), *(mentor.subjects or []), *( [mentor.experience] if getattr(mentor, "experience", None) else [])],
            )
            if (getattr(mentee, "interests", None) or getattr(mentee, "learning_difficulties", None))
            and (getattr(mentor, "areas_of_expertise", None) or mentor.subjects or getattr(mentor, "experience", None))
            else None,
        ),
        "goals": (
            "Goals and expectations",
            _similarity(getattr(mentee, "learning_goals", None), getattr(mentor, "mentorship_goals", None))
            if getattr(mentee, "learning_goals", None) and getattr(mentor, "mentorship_goals", None)
            else None,
        ),
        "availability": (
            "Availability",
            len(set(_normalized(mentee.availability)) & set(_normalized(mentor.availability))) / max(1, len(_normalized(mentee.availability))),
        ),
        "programme": (
            "Programme",
            (1.0 if mentee.programme.casefold() == mentor.programme.casefold() else 0.0)
            if getattr(mentee, "programme", None) and getattr(mentor, "programme", None)
            else None,
        ),
        "learning_style": (
            "Learning and teaching style",
            (
                1.0
                if mentee.learning_style == "flexible" or mentor.teaching_style == "flexible" or mentee.learning_style == mentor.teaching_style
                else 0.0
            )
            if getattr(mentee, "learning_style", None) and getattr(mentor, "teaching_style", None)
            else None,
        ),
        "communication": (
            "Communication method",
            (
                1.0
                if mentee.communication_method == "flexible" or mentor.communication_method == "flexible" or mentee.communication_method == mentor.communication_method
                else 0.0
            )
            if getattr(mentee, "communication_method", None) and getattr(mentor, "communication_method", None)
            else None,
        ),
        "preferences": (
            "Additional preferences",
            _similarity(
                [mentee.preferences],
                [*( [mentor.introduction] if getattr(mentor, "introduction", None) else []), *( [mentor.experience] if getattr(mentor, "experience", None) else [])],
            )
            if getattr(mentee, "preferences", None)
            and (getattr(mentor, "introduction", None) or getattr(mentor, "experience", None))
            else None,
        ),
        "capacity": (
            "Available mentor capacity",
            (mentor.preferred_capacity - active_capacity) / mentor.preferred_capacity,
        ),
    }
    configured_weight = sum(score_weights.values())
    if configured_weight <= 0 or any(weight < 0 for weight in score_weights.values()):
        raise ValueError("Mentorship match weights must be non-negative and have a positive total.")
    applicable_weight = sum(score_weights[key] for key, (_, value) in factors.items() if value is not None)
    if applicable_weight <= 0:
        return None
    breakdown = []
    weighted_score = 0.0
    for key, (label, value) in factors.items():
        weight = score_weights[key]
        if value is None or weight == 0:
            continue
        percentage = round(max(0, min(1, value)) * 100)
        points = percentage * weight
        weighted_score += points
        breakdown.append({"factor": key, "label": label, "score": percentage, "weight": weight})
    score = round(weighted_score / applicable_weight)
    return {"score": score, "shared_subjects": shared, "score_breakdown": breakdown}


def rank_mentor_candidates(
    mentors: list[MentorApplication],
    mentee: MenteeApplication,
    capacity_counts: dict[UUID, int],
    excluded_mentors: set[UUID] | None = None,
) -> list[tuple[MentorApplication, dict]]:
    excluded = excluded_mentors or set()
    ranked = []
    for mentor in mentors:
        if mentor.user_id == mentee.user_id or mentor.user_id in excluded:
            continue
        details = compatibility_details(mentor, mentee, capacity_counts.get(mentor.user_id, 0))
        if details is not None:
            ranked.append((mentor, details))
    return sorted(
        ranked,
        key=lambda item: (-item[1]["score"], item[0].created_at, str(item[0].user_id)),
    )


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
        candidates = rank_mentor_candidates(mentors, application, capacity_counts, excluded_mentors)
        if not candidates:
            continue

        selected, details = candidates[0]
        score = details["score"]
        match = MentorshipMatch(
            mentor_user_id=selected.user_id,
            mentee_user_id=application.user_id,
            mentee_application_id=application.id,
            status="proposed",
            match_score=score,
            shared_subjects=details["shared_subjects"],
            score_breakdown=details["score_breakdown"],
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
