"""Base model for all database models."""

from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from datetime import datetime
import uuid


class TimestampMixin:
    """Mixin that adds created_at and updated_at columns."""
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class UUIDMixin:
    """Mixin that adds UUID primary key."""
    
    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False
    )
