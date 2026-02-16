"""Subscription and billing schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID

from app.models.subscription import SubscriptionStatus, PlanTier


# Subscription Schemas
class SubscriptionBase(BaseModel):
    """Base subscription schema."""
    plan_id: PlanTier
    status: SubscriptionStatus


class SubscriptionCreate(BaseModel):
    """Schema for creating a subscription."""
    company_id: UUID
    plan_id: PlanTier
    payment_method_id: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    """Schema for updating a subscription."""
    plan_id: Optional[PlanTier] = None
    cancel_at_period_end: Optional[bool] = None


class SubscriptionResponse(SubscriptionBase):
    """Schema for subscription response."""
    id: UUID
    company_id: UUID
    stripe_subscription_id: str
    stripe_customer_id: str
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool
    canceled_at: Optional[datetime] = None
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Billing Schemas
class CheckoutSessionCreate(BaseModel):
    """Schema for creating a Stripe Checkout session."""
    plan_id: PlanTier
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    """Schema for Checkout session response."""
    session_id: str
    checkout_url: str


class BillingPortalRequest(BaseModel):
    """Schema for creating a billing portal session."""
    return_url: str


class BillingPortalResponse(BaseModel):
    """Schema for billing portal response."""
    portal_url: str


class InvoiceItem(BaseModel):
    """Schema for invoice line item."""
    description: str
    amount: float
    currency: str = "usd"


class InvoiceResponse(BaseModel):
    """Schema for invoice response."""
    id: str
    invoice_number: Optional[str] = None
    amount_due: float
    amount_paid: float
    currency: str
    status: str
    invoice_pdf: Optional[str] = None
    hosted_invoice_url: Optional[str] = None
    created: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    lines: list[InvoiceItem]


class PaymentMethodResponse(BaseModel):
    """Schema for payment method response."""
    id: str
    type: str
    card_brand: Optional[str] = None
    card_last4: Optional[str] = None
    card_exp_month: Optional[int] = None
    card_exp_year: Optional[int] = None
    is_default: bool = False


class UsageStats(BaseModel):
    """Schema for usage statistics per plan."""
    employees_count: int = 0
    employees_limit: Optional[int] = None
    transactions_count: int = 0
    transactions_limit: Optional[int] = None
    payroll_runs_count: int = 0
    payroll_runs_limit: Optional[int] = None
    messages_count: int = 0
    messages_limit: Optional[int] = None


class BillingDashboard(BaseModel):
    """Schema for billing dashboard response."""
    subscription: Optional[SubscriptionResponse] = None
    payment_method: Optional[PaymentMethodResponse] = None
    upcoming_invoice: Optional[InvoiceResponse] = None
    usage: UsageStats
    can_upgrade: bool = True
    requires_payment: bool = False


# Plan Configuration
class PlanFeatures(BaseModel):
    """Schema for plan features."""
    name: str
    price_monthly: float
    price_yearly: float
    features: list[str]
    limits: dict[str, Optional[int]]


PLAN_CONFIGS: dict[PlanTier, PlanFeatures] = {
    PlanTier.FREE: PlanFeatures(
        name="Free",
        price_monthly=0,
        price_yearly=0,
        features=[
            "Up to 5 employees",
            "Basic employee management",
            "Limited features"
        ],
        limits={
            "employees": 5,
            "transactions": 50,
            "payroll_runs": 2,
            "messages": 100
        }
    ),
    PlanTier.EMPLOYEES: PlanFeatures(
        name="Employees",
        price_monthly=49.99,
        price_yearly=479.88,
        features=[
            "Unlimited employees",
            "PTO tracking",
            "Shift scheduling",
            "Performance reviews"
        ],
        limits={
            "employees": None,
            "transactions": 0,
            "payroll_runs": 0,
            "messages": 500
        }
    ),
    PlanTier.FINANCE: PlanFeatures(
        name="Finance",
        price_monthly=79.99,
        price_yearly=767.88,
        features=[
            "Unlimited transactions",
            "Expense tracking",
            "Financial reports",
            "Budget management"
        ],
        limits={
            "employees": 0,
            "transactions": None,
            "payroll_runs": 0,
            "messages": 500
        }
    ),
    PlanTier.PAYROLL: PlanFeatures(
        name="Payroll",
        price_monthly=99.99,
        price_yearly=959.88,
        features=[
            "Unlimited payroll runs",
            "Tax calculations",
            "Direct deposit",
            "W-2/1099 generation"
        ],
        limits={
            "employees": 0,
            "transactions": 0,
            "payroll_runs": None,
            "messages": 500
        }
    ),
    PlanTier.COMMUNICATION: PlanFeatures(
        name="Communication",
        price_monthly=39.99,
        price_yearly=383.88,
        features=[
            "Unlimited messaging",
            "File sharing",
            "Team channels",
            "Announcements"
        ],
        limits={
            "employees": 0,
            "transactions": 0,
            "payroll_runs": 0,
            "messages": None
        }
    ),
    PlanTier.ALL_ACCESS: PlanFeatures(
        name="All Access",
        price_monthly=199.99,
        price_yearly=1919.88,
        features=[
            "All features included",
            "Unlimited everything",
            "Priority support",
            "Advanced analytics"
        ],
        limits={
            "employees": None,
            "transactions": None,
            "payroll_runs": None,
            "messages": None
        }
    )
}
