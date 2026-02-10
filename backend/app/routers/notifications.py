"""Notifications router for user notifications."""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta

from ..mongo_models import Notification, NotificationType
from ..auth.security import get_current_user
from ..models.user import User
from ..schemas.notifications import (
    NotificationCreate,
    NotificationResponse
)

router = APIRouter()


@router.post("/create", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new notification (admin only)."""
    
    # Calculate expiry (default 30 days)
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    notif = Notification(
        user_id=notification.user_id,
        company_id=current_user.company_id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        data=notification.data or {},
        action_url=notification.action_url,
        expires_at=expires_at
    )
    
    await notif.insert()
    
    return NotificationResponse(
        id=str(notif.id),
        user_id=notif.user_id,
        company_id=notif.company_id,
        type=notif.type,
        title=notif.title,
        message=notif.message,
        data=notif.data,
        is_read=notif.is_read,
        action_url=notif.action_url,
        created_at=notif.created_at,
        read_at=notif.read_at
    )


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    unread_only: bool = False,
    type_filter: Optional[NotificationType] = None,
    current_user: User = Depends(get_current_user)
):
    """Get user notifications."""
    
    query = {"user_id": current_user.id}
    
    if unread_only:
        query["is_read"] = False
    
    if type_filter:
        query["type"] = type_filter
    
    notifications = await Notification.find(query).sort("-created_at").skip(skip).limit(limit).to_list()
    
    return [
        NotificationResponse(
            id=str(n.id),
            user_id=n.user_id,
            company_id=n.company_id,
            type=n.type,
            title=n.title,
            message=n.message,
            data=n.data,
            is_read=n.is_read,
            action_url=n.action_url,
            created_at=n.created_at,
            read_at=n.read_at
        )
        for n in notifications
    ]


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read."""
    
    notification = await Notification.get(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await notification.save()
    
    return {"status": "success", "message": "Notification marked as read"}


@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read."""
    
    notifications = await Notification.find(
        {
            "user_id": current_user.id,
            "is_read": False
        }
    ).to_list()
    
    for notif in notifications:
        notif.is_read = True
        notif.read_at = datetime.utcnow()
        await notif.save()
    
    return {"status": "success", "count": len(notifications)}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a notification."""
    
    notification = await Notification.get(notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await notification.delete()
    
    return {"status": "success", "message": "Notification deleted"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications."""
    
    count = await Notification.find(
        {
            "user_id": current_user.id,
            "is_read": False
        }
    ).count()
    
    return {"unread_count": count}
