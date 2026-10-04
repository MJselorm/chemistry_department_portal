from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: str
    kind: Literal["announcement", "event", "resource"]
    title: str
    message: str
    url: str
    created_at: datetime
    is_read: bool


class NotificationFeed(BaseModel):
    items: list[NotificationItem]
    unread_count: int

