from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Announcement, User
from ..schemas import AnnouncementCreate, AnnouncementOut
from ..security import get_current_user, require_admin

router = APIRouter(tags=["announcements"])
DB = Annotated[Session, Depends(get_db)]
Admin = Annotated[User, Depends(require_admin)]


@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(session: DB, user: Annotated[User, Depends(get_current_user)], limit: int = Query(50, ge=1, le=100)):
    """Published department notices visible to the signed-in user's audience."""
    query = session.query(Announcement)
    if user.role != "admin":
        audiences = ["All students"]
        if user.level:
            audiences.append(f"Level {user.level}")
        query = query.filter(Announcement.audience.in_(audiences))
    return (
        query
        .order_by(Announcement.is_pinned.desc(), Announcement.published_at.desc())
        .limit(min(limit, 100))
        .all()
    )


@router.post("/admin/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(payload: AnnouncementCreate, session: DB, admin: Admin):
    announcement = Announcement(**payload.model_dump(), created_by_id=admin.id)
    session.add(announcement)
    session.commit()
    session.refresh(announcement)
    return announcement


@router.delete("/admin/announcements/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(id: UUID, session: DB, admin: Admin):
    announcement = session.query(Announcement).filter(Announcement.id == id).first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    session.delete(announcement)
    session.commit()
    return None
