"""Messaging router for chat and communication."""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from ..mongo_models import ChatMessage, MessageStatus
from ..auth.security import get_current_user, RoleChecker
from ..models.user import User
from ..schemas.messaging import (
    MessageCreate,
    MessageResponse,
    MessageUpdate,
    ThreadResponse
)

router = APIRouter()


@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a new message."""
    
    # Create message document
    chat_message = ChatMessage(
        sender_id=current_user.id,
        recipient_id=message.recipient_id,
        company_id=current_user.company_id,
        message_type=message.message_type,
        thread_id=message.thread_id,
        subject=message.subject,
        content=message.content,
        attachments=message.attachments or [],
        status=MessageStatus.SENT,
        sent_at=datetime.utcnow()
    )
    
    await chat_message.insert()
    
    return MessageResponse(
        id=str(chat_message.id),
        sender_id=chat_message.sender_id,
        recipient_id=chat_message.recipient_id,
        company_id=chat_message.company_id,
        message_type=chat_message.message_type,
        thread_id=chat_message.thread_id,
        subject=chat_message.subject,
        content=chat_message.content,
        attachments=chat_message.attachments,
        status=chat_message.status,
        is_read=chat_message.is_read,
        sent_at=chat_message.sent_at,
        read_at=chat_message.read_at
    )


@router.get("/inbox", response_model=List[MessageResponse])
async def get_inbox(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get messages in user's inbox."""
    
    query = {"recipient_id": current_user.id}
    
    if unread_only:
        query["is_read"] = False
    
    messages = await ChatMessage.find(query).sort("-sent_at").skip(skip).limit(limit).to_list()
    
    return [
        MessageResponse(
            id=str(msg.id),
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            company_id=msg.company_id,
            message_type=msg.message_type,
            thread_id=msg.thread_id,
            subject=msg.subject,
            content=msg.content,
            attachments=msg.attachments,
            status=msg.status,
            is_read=msg.is_read,
            sent_at=msg.sent_at,
            read_at=msg.read_at
        )
        for msg in messages
    ]


@router.get("/sent", response_model=List[MessageResponse])
async def get_sent_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get messages sent by user."""
    
    messages = await ChatMessage.find(
        {"sender_id": current_user.id}
    ).sort("-sent_at").skip(skip).limit(limit).to_list()
    
    return [
        MessageResponse(
            id=str(msg.id),
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            company_id=msg.company_id,
            message_type=msg.message_type,
            thread_id=msg.thread_id,
            subject=msg.subject,
            content=msg.content,
            attachments=msg.attachments,
            status=msg.status,
            is_read=msg.is_read,
            sent_at=msg.sent_at,
            read_at=msg.read_at
        )
        for msg in messages
    ]


@router.get("/thread/{thread_id}", response_model=List[MessageResponse])
async def get_thread(
    thread_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all messages in a thread."""
    
    messages = await ChatMessage.find(
        {
            "thread_id": thread_id,
            "$or": [
                {"sender_id": current_user.id},
                {"recipient_id": current_user.id}
            ]
        }
    ).sort("sent_at").to_list()
    
    return [
        MessageResponse(
            id=str(msg.id),
            sender_id=msg.sender_id,
            recipient_id=msg.recipient_id,
            company_id=msg.company_id,
            message_type=msg.message_type,
            thread_id=msg.thread_id,
            subject=msg.subject,
            content=msg.content,
            attachments=msg.attachments,
            status=msg.status,
            is_read=msg.is_read,
            sent_at=msg.sent_at,
            read_at=msg.read_at
        )
        for msg in messages
    ]


@router.patch("/{message_id}/read")
async def mark_as_read(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark message as read."""
    
    message = await ChatMessage.get(message_id)
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to mark this message as read")
    
    message.is_read = True
    message.read_at = datetime.utcnow()
    message.status = MessageStatus.READ
    
    await message.save()
    
    return {"status": "success", "message": "Message marked as read"}


@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Soft delete a message."""
    
    message = await ChatMessage.get(message_id)
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
    
    message.deleted_at = datetime.utcnow()
    await message.save()
    
    return {"status": "success", "message": "Message deleted"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unread messages."""
    
    count = await ChatMessage.find(
        {
            "recipient_id": current_user.id,
            "is_read": False
        }
    ).count()
    
    return {"unread_count": count}
