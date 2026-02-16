"""Billing and subscription management router."""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime
import stripe
import logging

from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.models.subscription import Subscription, SubscriptionStatus, PlanTier
from app.models.employee import Employee
from app.models.finance import Transaction
from app.models.payroll import PayrollRun
from app.schemas.subscription import (
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    BillingPortalRequest,
    BillingPortalResponse,
    SubscriptionResponse,
    InvoiceResponse,
    InvoiceItem,
    PaymentMethodResponse,
    UsageStats,
    BillingDashboard,
    PLAN_CONFIGS
)
from app.auth.security import get_current_user
from app.utils.stripe_service import StripeService

router = APIRouter(prefix="/api/billing", tags=["billing"])
logger = logging.getLogger(__name__)


@router.post("/checkout", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    checkout_data: CheckoutSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe Checkout session for subscribing to a plan.
    
    Args:
        checkout_data: Checkout session creation data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Checkout session with URL
    """
    # Get company
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Create Stripe customer if doesn't exist
    if not company.stripe_customer_id:
        customer = await StripeService.create_customer(
            email=company.email,
            name=company.name,
            metadata={"company_id": str(company.id)}
        )
        company.stripe_customer_id = customer.id
        await db.commit()
    
    # Create checkout session
    session = await StripeService.create_checkout_session(
        customer_id=company.stripe_customer_id,
        plan_id=checkout_data.plan_id,
        success_url=checkout_data.success_url,
        cancel_url=checkout_data.cancel_url,
        metadata={
            "company_id": str(company.id),
            "user_id": str(current_user.id),
            "plan_id": checkout_data.plan_id.value
        }
    )
    
    return CheckoutSessionResponse(
        session_id=session.id,
        checkout_url=session.url
    )


@router.post("/portal", response_model=BillingPortalResponse)
async def create_billing_portal_session(
    portal_data: BillingPortalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe billing portal session for managing subscription.
    
    Args:
        portal_data: Portal session data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Portal session with URL
    """
    # Get company
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company or not company.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No billing account found"
        )
    
    # Create portal session
    session = await StripeService.create_billing_portal_session(
        customer_id=company.stripe_customer_id,
        return_url=portal_data.return_url
    )
    
    return BillingPortalResponse(portal_url=session.url)


@router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current subscription for the company.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Current subscription or None
    """
    result = await db.execute(
        select(Subscription)
        .where(Subscription.company_id == current_user.company_id)
        .where(Subscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value,
            SubscriptionStatus.PAST_DUE.value
        ]))
        .order_by(Subscription.created_at.desc())
    )
    subscription = result.scalar_one_or_none()
    
    return subscription


@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List invoices for the company.
    
    Args:
        limit: Maximum number of invoices
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        List of invoices
    """
    # Get company
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company or not company.stripe_customer_id:
        return []
    
    # Get invoices from Stripe
    stripe_invoices = await StripeService.list_invoices(
        customer_id=company.stripe_customer_id,
        limit=limit
    )
    
    # Convert to response format
    invoices = []
    for inv in stripe_invoices:
        invoice_items = []
        for line in inv.lines.data:
            invoice_items.append(InvoiceItem(
                description=line.description or "",
                amount=line.amount / 100,  # Convert cents to dollars
                currency=line.currency
            ))
        
        invoices.append(InvoiceResponse(
            id=inv.id,
            invoice_number=inv.number,
            amount_due=inv.amount_due / 100,
            amount_paid=inv.amount_paid / 100,
            currency=inv.currency,
            status=inv.status,
            invoice_pdf=inv.invoice_pdf,
            hosted_invoice_url=inv.hosted_invoice_url,
            created=datetime.fromtimestamp(inv.created),
            due_date=datetime.fromtimestamp(inv.due_date) if inv.due_date else None,
            paid_at=datetime.fromtimestamp(inv.status_transitions.paid_at) if inv.status_transitions.paid_at else None,
            lines=invoice_items
        ))
    
    return invoices


@router.get("/payment-method", response_model=Optional[PaymentMethodResponse])
async def get_payment_method(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get default payment method for the company.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Payment method or None
    """
    # Get company
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company or not company.stripe_customer_id:
        return None
    
    # Get payment method from Stripe
    payment_method = await StripeService.get_payment_method(
        customer_id=company.stripe_customer_id
    )
    
    if not payment_method:
        return None
    
    # Format response
    response = PaymentMethodResponse(
        id=payment_method.id,
        type=payment_method.type,
        is_default=True
    )
    
    if payment_method.type == "card" and payment_method.card:
        response.card_brand = payment_method.card.brand
        response.card_last4 = payment_method.card.last4
        response.card_exp_month = payment_method.card.exp_month
        response.card_exp_year = payment_method.card.exp_year
    
    return response


@router.get("/usage", response_model=UsageStats)
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get usage statistics for the company's current plan.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Usage statistics
    """
    # Get current subscription
    result = await db.execute(
        select(Subscription)
        .where(Subscription.company_id == current_user.company_id)
        .where(Subscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ]))
    )
    subscription = result.scalar_one_or_none()
    
    # Get plan limits
    limits = {}
    if subscription and subscription.plan_id in PLAN_CONFIGS:
        limits = PLAN_CONFIGS[subscription.plan_id].limits
    
    # Count employees
    result = await db.execute(
        select(Employee).where(Employee.company_id == current_user.company_id)
    )
    employees_count = len(result.scalars().all())
    
    # Count transactions
    result = await db.execute(
        select(Transaction).where(Transaction.company_id == current_user.company_id)
    )
    transactions_count = len(result.scalars().all())
    
    # Count payroll runs
    result = await db.execute(
        select(PayrollRun).where(PayrollRun.company_id == current_user.company_id)
    )
    payroll_runs_count = len(result.scalars().all())
    
    # TODO: Count messages from MongoDB
    messages_count = 0
    
    return UsageStats(
        employees_count=employees_count,
        employees_limit=limits.get("employees"),
        transactions_count=transactions_count,
        transactions_limit=limits.get("transactions"),
        payroll_runs_count=payroll_runs_count,
        payroll_runs_limit=limits.get("payroll_runs"),
        messages_count=messages_count,
        messages_limit=limits.get("messages")
    )


@router.get("/dashboard", response_model=BillingDashboard)
async def get_billing_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive billing dashboard data.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Complete billing dashboard
    """
    # Get subscription
    subscription = await get_current_subscription(current_user, db)
    
    # Get payment method
    payment_method = await get_payment_method(current_user, db)
    
    # Get upcoming invoice
    upcoming_invoice = None
    result = await db.execute(
        select(Company).where(Company.id == current_user.company_id)
    )
    company = result.scalar_one_or_none()
    
    if company and company.stripe_customer_id:
        stripe_invoice = await StripeService.get_upcoming_invoice(company.stripe_customer_id)
        if stripe_invoice:
            invoice_items = []
            for line in stripe_invoice.lines.data:
                invoice_items.append(InvoiceItem(
                    description=line.description or "",
                    amount=line.amount / 100,
                    currency=line.currency
                ))
            
            upcoming_invoice = InvoiceResponse(
                id=stripe_invoice.id,
                invoice_number=None,
                amount_due=stripe_invoice.amount_due / 100,
                amount_paid=0,
                currency=stripe_invoice.currency,
                status="draft",
                invoice_pdf=None,
                hosted_invoice_url=None,
                created=datetime.now(),
                due_date=datetime.fromtimestamp(stripe_invoice.period_end) if stripe_invoice.period_end else None,
                paid_at=None,
                lines=invoice_items
            )
    
    # Get usage stats
    usage = await get_usage_stats(current_user, db)
    
    # Determine if payment is required
    requires_payment = not subscription or subscription.status in [
        SubscriptionStatus.PAST_DUE.value,
        SubscriptionStatus.UNPAID.value
    ]
    
    # Determine if can upgrade
    can_upgrade = subscription is None or subscription.plan_id != PlanTier.ALL_ACCESS
    
    return BillingDashboard(
        subscription=subscription,
        payment_method=payment_method,
        upcoming_invoice=upcoming_invoice,
        usage=usage,
        can_upgrade=can_upgrade,
        requires_payment=requires_payment
    )


@router.post("/webhooks")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db)
):
    """Stripe webhook endpoint for subscription events.
    
    Args:
        request: Raw request object
        stripe_signature: Stripe signature header
        db: Database session
        
    Returns:
        Success response
    """
    payload = await request.body()
    
    # Verify webhook signature
    event = StripeService.construct_webhook_event(payload, stripe_signature)
    
    logger.info(f"Received Stripe webhook: {event.type}")
    
    # Handle different event types
    if event.type == "customer.subscription.created":
        await handle_subscription_created(event.data.object, db)
    elif event.type == "customer.subscription.updated":
        await handle_subscription_updated(event.data.object, db)
    elif event.type == "customer.subscription.deleted":
        await handle_subscription_deleted(event.data.object, db)
    elif event.type == "invoice.payment_succeeded":
        await handle_payment_succeeded(event.data.object, db)
    elif event.type == "invoice.payment_failed":
        await handle_payment_failed(event.data.object, db)
    
    return {"status": "success"}


async def handle_subscription_created(subscription_data: stripe.Subscription, db: AsyncSession):
    """Handle subscription.created webhook."""
    company_id = subscription_data.metadata.get("company_id")
    if not company_id:
        logger.error("No company_id in subscription metadata")
        return
    
    # Create subscription record
    subscription = Subscription(
        company_id=company_id,
        stripe_subscription_id=subscription_data.id,
        stripe_customer_id=subscription_data.customer,
        plan_id=subscription_data.metadata.get("plan_id", PlanTier.FREE.value),
        status=subscription_data.status,
        current_period_start=datetime.fromtimestamp(subscription_data.current_period_start),
        current_period_end=datetime.fromtimestamp(subscription_data.current_period_end),
        cancel_at_period_end=subscription_data.cancel_at_period_end,
        trial_start=datetime.fromtimestamp(subscription_data.trial_start) if subscription_data.trial_start else None,
        trial_end=datetime.fromtimestamp(subscription_data.trial_end) if subscription_data.trial_end else None
    )
    
    db.add(subscription)
    
    # Update company
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    if company:
        company.stripe_subscription_id = subscription_data.id
    
    await db.commit()
    logger.info(f"Created subscription {subscription.id} for company {company_id}")


async def handle_subscription_updated(sub_data: stripe.Subscription, db: AsyncSession):
    """Handle subscription.updated webhook."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.stripe_subscription_id == sub_data.id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        logger.error(f"Subscription not found: {sub_data.id}")
        return
    
    # Update subscription
    subscription.status = sub_data.status
    subscription.current_period_start = datetime.fromtimestamp(sub_data.current_period_start)
    subscription.current_period_end = datetime.fromtimestamp(sub_data.current_period_end)
    subscription.cancel_at_period_end = sub_data.cancel_at_period_end
    
    if sub_data.canceled_at:
        subscription.canceled_at = datetime.fromtimestamp(sub_data.canceled_at)
    
    await db.commit()
    logger.info(f"Updated subscription {subscription.id}")


async def handle_subscription_deleted(sub_data: stripe.Subscription, db: AsyncSession):
    """Handle subscription.deleted webhook."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.stripe_subscription_id == sub_data.id)
    )
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        logger.error(f"Subscription not found: {sub_data.id}")
        return
    
    # Update status to canceled
    subscription.status = SubscriptionStatus.CANCELED.value
    subscription.canceled_at = datetime.utcnow()
    
    await db.commit()
    logger.info(f"Canceled subscription {subscription.id}")


async def handle_payment_succeeded(invoice_data: stripe.Invoice, db: AsyncSession):
    """Handle invoice.payment_succeeded webhook."""
    logger.info(f"Payment succeeded for invoice {invoice_data.id}")
    # TODO: Send receipt email


async def handle_payment_failed(invoice_data: stripe.Invoice, db: AsyncSession):
    """Handle invoice.payment_failed webhook."""
    logger.error(f"Payment failed for invoice {invoice_data.id}")
    # TODO: Send payment failed email
