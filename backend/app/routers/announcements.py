from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Announcement, User
from ..schemas import AnnouncementCreate, AnnouncementOut
from ..security import require_admin

router = APIRouter(tags=["announcements"])
DB = Annotated[Session, Depends(get_db)]
Admin = Annotated[User, Depends(require_admin)]


@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(session: DB, limit: int = 50):
    """Published department notices visible to every signed-in portal user."""
    return (
        session.query(Announcement)
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

