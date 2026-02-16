"""Stripe payment service for subscription management."""

import stripe
from typing import Optional
from datetime import datetime
from fastapi import HTTPException, status

from app.config import settings
from app.models.subscription import PlanTier

# Initialize Stripe
stripe.api_key = settings.stripe_secret_key


class StripeService:
    """Service class for Stripe operations."""
    
    # Map plan IDs to Stripe Price IDs
    PRICE_MAP = {
        PlanTier.EMPLOYEES: settings.stripe_price_id_employees,
        PlanTier.FINANCE: settings.stripe_price_id_finance,
        PlanTier.PAYROLL: settings.stripe_price_id_payroll,
        PlanTier.COMMUNICATION: settings.stripe_price_id_communication,
        PlanTier.ALL_ACCESS: settings.stripe_price_id_all_access,
    }
    
    @staticmethod
    async def create_customer(
        email: str,
        name: str,
        metadata: Optional[dict] = None
    ) -> stripe.Customer:
        """Create a Stripe customer.
        
        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata
            
        Returns:
            Stripe Customer object
        """
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create Stripe customer: {str(e)}"
            )
    
    @staticmethod
    async def create_checkout_session(
        customer_id: str,
        plan_id: PlanTier,
        success_url: str,
        cancel_url: str,
        metadata: Optional[dict] = None
    ) -> stripe.checkout.Session:
        """Create a Stripe Checkout session for subscription.
        
        Args:
            customer_id: Stripe customer ID
            plan_id: Plan tier to subscribe to
            success_url: URL to redirect after successful payment
            cancel_url: URL to redirect if user cancels
            metadata: Additional metadata
            
        Returns:
            Stripe Checkout Session object
        """
        price_id = StripeService.PRICE_MAP.get(plan_id)
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan ID: {plan_id}"
            )
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1,
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {},
                allow_promotion_codes=True,
                billing_address_collection="required",
            )
            return session
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create checkout session: {str(e)}"
            )
    
    @staticmethod
    async def create_billing_portal_session(
        customer_id: str,
        return_url: str
    ) -> stripe.billing_portal.Session:
        """Create a Stripe billing portal session.
        
        Args:
            customer_id: Stripe customer ID
            return_url: URL to return to after portal session
            
        Returns:
            Stripe billing portal Session object
        """
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create billing portal session: {str(e)}"
            )
    
    @staticmethod
    async def get_subscription(
        subscription_id: str
    ) -> stripe.Subscription:
        """Get subscription details from Stripe.
        
        Args:
            subscription_id: Stripe subscription ID
            
        Returns:
            Stripe Subscription object
        """
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return subscription
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subscription not found: {str(e)}"
            )
    
    @staticmethod
    async def update_subscription(
        subscription_id: str,
        price_id: Optional[str] = None,
        cancel_at_period_end: Optional[bool] = None
    ) -> stripe.Subscription:
        """Update a subscription.
        
        Args:
            subscription_id: Stripe subscription ID
            price_id: New price ID (for plan changes)
            cancel_at_period_end: Whether to cancel at period end
            
        Returns:
            Updated Stripe Subscription object
        """
        try:
            params = {}
            
            if price_id:
                # Get current subscription to update items
                subscription = await StripeService.get_subscription(subscription_id)
                params["items"] = [{
                    "id": subscription["items"]["data"][0].id,
                    "price": price_id,
                }]
                params["proration_behavior"] = "always_invoice"
            
            if cancel_at_period_end is not None:
                params["cancel_at_period_end"] = cancel_at_period_end
            
            subscription = stripe.Subscription.modify(
                subscription_id,
                **params
            )
            return subscription
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update subscription: {str(e)}"
            )
    
    @staticmethod
    async def cancel_subscription(
        subscription_id: str,
        immediately: bool = False
    ) -> stripe.Subscription:
        """Cancel a subscription.
        
        Args:
            subscription_id: Stripe subscription ID
            immediately: If True, cancel immediately; if False, at period end
            
        Returns:
            Canceled/Updated Stripe Subscription object
        """
        try:
            if immediately:
                subscription = stripe.Subscription.cancel(subscription_id)
            else:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            return subscription
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to cancel subscription: {str(e)}"
            )
    
    @staticmethod
    async def list_invoices(
        customer_id: str,
        limit: int = 10
    ) -> list[stripe.Invoice]:
        """List invoices for a customer.
        
        Args:
            customer_id: Stripe customer ID
            limit: Maximum number of invoices to return
            
        Returns:
            List of Stripe Invoice objects
        """
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            return invoices.data
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to list invoices: {str(e)}"
            )
    
    @staticmethod
    async def get_upcoming_invoice(
        customer_id: str
    ) -> Optional[stripe.Invoice]:
        """Get upcoming invoice for a customer.
        
        Args:
            customer_id: Stripe customer ID
            
        Returns:
            Stripe Invoice object or None
        """
        try:
            invoice = stripe.Invoice.upcoming(customer=customer_id)
            return invoice
        except stripe.error.InvalidRequestError:
            # No upcoming invoice
            return None
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get upcoming invoice: {str(e)}"
            )
    
    @staticmethod
    async def get_payment_method(
        customer_id: str
    ) -> Optional[stripe.PaymentMethod]:
        """Get default payment method for a customer.
        
        Args:
            customer_id: Stripe customer ID
            
        Returns:
            Stripe PaymentMethod object or None
        """
        try:
            customer = stripe.Customer.retrieve(customer_id)
            if customer.invoice_settings.default_payment_method:
                payment_method = stripe.PaymentMethod.retrieve(
                    customer.invoice_settings.default_payment_method
                )
                return payment_method
            return None
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get payment method: {str(e)}"
            )
    
    @staticmethod
    def construct_webhook_event(
        payload: bytes,
        sig_header: str
    ) -> stripe.Event:
        """Construct and verify a webhook event from Stripe.
        
        Args:
            payload: Raw request body
            sig_header: Stripe signature header
            
        Returns:
            Verified Stripe Event object
            
        Raises:
            HTTPException: If signature verification fails
        """
        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.stripe_webhook_secret
            )
            return event
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
