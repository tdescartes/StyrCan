"""Subscription models for Stripe billing integration."""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from app.database import Base


class SubscriptionStatus(str, enum.Enum):
    """Subscription status enum matching Stripe statuses."""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"
    INCOMPLETE_EXPIRED = "incomplete_expired"
    TRIALING = "trialing"
    PAUSED = "paused"


class PlanTier(str, enum.Enum):
    """Plan tiers for Pulse SaaS."""
    FREE = "free"
    EMPLOYEES = "employees"
    FINANCE = "finance"
    PAYROLL = "payroll"
    COMMUNICATION = "communication"
    ALL_ACCESS = "all_access"


class Subscription(Base):
    """Subscription model linked to Stripe subscription."""
    
    __tablename__ = "subscriptions"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Company relationship
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )
    
    # Stripe IDs
    stripe_subscription_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    stripe_customer_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    
    # Subscription details
    plan_id: Mapped[str] = mapped_column(
        SQLEnum(PlanTier, native_enum=False),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        SQLEnum(SubscriptionStatus, native_enum=False),
        nullable=False,
        default=SubscriptionStatus.ACTIVE
    )
    
    # Billing period
    current_period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    current_period_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    
    # Cancellation
    cancel_at_period_end: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    canceled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Trial
    trial_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    trial_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Additional data (renamed from 'metadata' to avoid SQLAlchemy reserved word)
    extra_data: Mapped[Optional[str]] = mapped_column(
        String,
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Indexes
    __table_args__ = (
        {"comment": "Stripe subscription data for companies"}
    )
    
    def is_active(self) -> bool:
        """Check if subscription is currently active."""
        return self.status in [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.TRIALING
        ]
    
    def has_feature(self, feature: PlanTier) -> bool:
        """Check if subscription includes a specific feature.
        
        Args:
            feature: Feature to check (e.g. PlanTier.EMPLOYEES)
            
        Returns:
            True if subscription includes the feature
        """
        if self.plan_id == PlanTier.ALL_ACCESS:
            return True
        if self.plan_id == PlanTier.FREE:
            return False
        return self.plan_id == feature
    
    def __repr__(self) -> str:
        return f"<Subscription {self.id} - {self.plan_id} ({self.status})>"
