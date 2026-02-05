"""Pydantic schemas for notifications."""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class NotificationCreate(BaseModel):
    """Schema for creating a notification."""
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: str
    user_id: str
    company_id: str
    type: str
    title: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    action_url: Optional[str]
    created_at: datetime
    read_at: Optional[datetime]
    
    model_config = {
        "from_attributes": True
    }
