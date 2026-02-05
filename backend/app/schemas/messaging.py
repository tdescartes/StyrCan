"""Pydantic schemas for messaging."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    recipient_id: Optional[str] = None
    message_type: str = "direct"
    thread_id: Optional[str] = None
    subject: Optional[str] = None
    content: str
    attachments: Optional[List[Dict[str, str]]] = None


class MessageUpdate(BaseModel):
    """Schema for updating a message."""
    content: Optional[str] = None
    is_read: Optional[bool] = None


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: str
    sender_id: str
    recipient_id: Optional[str]
    company_id: str
    message_type: str
    thread_id: Optional[str]
    subject: Optional[str]
    content: str
    attachments: List[Dict[str, str]]
    status: str
    is_read: bool
    sent_at: datetime
    read_at: Optional[datetime]
    
    model_config = {
        "from_attributes": True
    }


class ThreadResponse(BaseModel):
    """Schema for thread response."""
    thread_id: str
    participants: List[str]
    last_message: Optional[MessageResponse]
    unread_count: int
    created_at: datetime
