"""MongoDB document models using Beanie ODM."""

from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum


# Enums for structured data
class AuditAction(str, Enum):
    """Audit log action types."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    FAILED_LOGIN = "failed_login"
    PASSWORD_CHANGE = "password_change"
    PERMISSION_CHANGE = "permission_change"


class MessageStatus(str, Enum):
    """Message delivery status."""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class NotificationType(str, Enum):
    """Notification types."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"
    PAYROLL = "payroll"
    PTO = "pto"
    SHIFT = "shift"
    MESSAGE = "message"


class LogLevel(str, Enum):
    """Application log levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# Document Models
class AuditLog(Document):
    """Audit log for tracking user actions and system events."""
    
    user_id: Optional[str] = None
    company_id: Optional[str] = None
    action: AuditAction
    resource_type: str  # e.g., "employee", "payroll", "transaction"
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    changes: Optional[Dict[str, Any]] = None  # before/after values
    success: bool = True
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "audit_logs"
        indexes = [
            "user_id",
            "company_id",
            "action",
            "resource_type",
            "timestamp",
            [("company_id", 1), ("timestamp", -1)],
            [("user_id", 1), ("timestamp", -1)]
        ]


class ChatMessage(Document):
    """Chat message for real-time communication."""
    
    sender_id: str
    recipient_id: Optional[str] = None  # None for broadcast
    company_id: str
    message_type: str = "direct"  # direct, broadcast, group
    thread_id: Optional[str] = None  # For grouping conversations
    subject: Optional[str] = None
    content: str
    attachments: List[Dict[str, str]] = Field(default_factory=list)
    status: MessageStatus = MessageStatus.SENT
    is_read: bool = False
    read_at: Optional[datetime] = None
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    reactions: Dict[str, List[str]] = Field(default_factory=dict)  # emoji -> [user_ids]
    
    class Settings:
        name = "chat_messages"
        indexes = [
            "sender_id",
            "recipient_id",
            "company_id",
            "thread_id",
            "sent_at",
            [("company_id", 1), ("sent_at", -1)],
            [("recipient_id", 1), ("is_read", 1), ("sent_at", -1)],
            [("thread_id", 1), ("sent_at", 1)]
        ]


class Notification(Document):
    """User notifications with auto-expiry."""
    
    user_id: str
    company_id: str
    type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)  # Additional context
    is_read: bool = False
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None  # For TTL index
    
    class Settings:
        name = "notifications"
        indexes = [
            "user_id",
            "company_id",
            "type",
            "is_read",
            "created_at",
            [("user_id", 1), ("is_read", 1), ("created_at", -1)],
            [("expires_at", 1)]  # TTL index
        ]


class AnalyticsEvent(Document):
    """Analytics and metrics tracking."""
    
    company_id: str
    event_type: str  # e.g., "page_view", "button_click", "feature_usage"
    event_name: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)
    metrics: Dict[str, float] = Field(default_factory=dict)  # numerical metrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "analytics_events"
        indexes = [
            "company_id",
            "event_type",
            "event_name",
            "user_id",
            "timestamp",
            [("company_id", 1), ("event_type", 1), ("timestamp", -1)],
            [("company_id", 1), ("timestamp", -1)]
        ]


class DocumentMetadata(Document):
    """Metadata for uploaded documents and files."""
    
    company_id: str
    uploaded_by: str
    document_type: str  # e.g., "contract", "resume", "invoice", "receipt"
    file_name: str
    file_size: int  # bytes
    file_path: str  # storage path or URL
    mime_type: str
    tags: List[str] = Field(default_factory=list)
    related_entity_type: Optional[str] = None  # e.g., "employee", "transaction"
    related_entity_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1
    is_deleted: bool = False
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    
    class Settings:
        name = "document_metadata"
        indexes = [
            "company_id",
            "uploaded_by",
            "document_type",
            "related_entity_type",
            "related_entity_id",
            "uploaded_at",
            [("company_id", 1), ("is_deleted", 1), ("uploaded_at", -1)],
            [("related_entity_type", 1), ("related_entity_id", 1)]
        ]


class ApplicationLog(Document):
    """Application logs for debugging and monitoring."""
    
    level: LogLevel
    logger_name: str
    message: str
    module: Optional[str] = None
    function: Optional[str] = None
    line_number: Optional[int] = None
    exception: Optional[str] = None
    stack_trace: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    user_id: Optional[str] = None
    company_id: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "application_logs"
        indexes = [
            "level",
            "logger_name",
            "timestamp",
            "request_id",
            [("level", 1), ("timestamp", -1)],
            [("company_id", 1), ("timestamp", -1)]
        ]
