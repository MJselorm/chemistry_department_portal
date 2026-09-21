from typing import Annotated

from fastapi import APIRouter, Depends

from ..models import User
from ..security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/test")
def admin_test(current_user: Annotated[User, Depends(require_admin)]):
    """Temporary endpoint for verifying the database-backed admin role check."""
    return {"message": "Admin authorization verified.", "email": current_user.email}
