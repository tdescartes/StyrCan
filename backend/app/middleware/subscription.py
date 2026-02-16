"""Subscription middleware for enforcing plan limits and feature access."""

from functools import wraps
from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, Callable

from app.database import get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus, PlanTier
from app.models.employee import Employee
from app.models.finance import Transaction
from app.models.payroll import PayrollRun
from app.schemas.subscription import PLAN_CONFIGS
from app.auth.security import get_current_user


async def get_active_subscription(
    current_user: User,
    db: AsyncSession
) -> Optional[Subscription]:
    """Get active subscription for current user's company.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Active subscription or None
    """
    result = await db.execute(
        select(Subscription)
        .where(Subscription.company_id == current_user.company_id)
        .where(Subscription.status.in_([
            SubscriptionStatus.ACTIVE.value,
            SubscriptionStatus.TRIALING.value
        ]))
        .order_by(Subscription.created_at.desc())
    )
    return result.scalar_one_or_none()


async def check_feature_access(
    feature: PlanTier,
    current_user: User,
    db: AsyncSession
) -> bool:
    """Check if user has access to a specific feature.
    
    Args:
        feature: Feature to check (e.g. PlanTier.EMPLOYEES)
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        True if user has access, False otherwise
    """
    subscription = await get_active_subscription(current_user, db)
    
    if not subscription:
        # No subscription - only FREE features allowed
        return feature == PlanTier.FREE
    
    # ALL_ACCESS has everything
    if subscription.plan_id == PlanTier.ALL_ACCESS.value:
        return True
    
    # Check if subscription includes this feature
    return subscription.plan_id == feature.value


async def check_usage_limit(
    resource_type: str,
    current_user: User,
    db: AsyncSession
) -> tuple[bool, int, Optional[int]]:
    """Check if usage is within plan limits.
    
    Args:
        resource_type: Type of resource ('employees', 'transactions', 'payroll_runs', 'messages')
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Tuple of (within_limit, current_count, limit)
    """
    subscription = await get_active_subscription(current_user, db)
    
    # Get plan limits
    plan_id = PlanTier(subscription.plan_id) if subscription else PlanTier.FREE
    plan_config = PLAN_CONFIGS.get(plan_id)
    
    if not plan_config:
        return False, 0, None
    
    limit = plan_config.limits.get(resource_type)
    
    # None means unlimited
    if limit is None:
        return True, 0, None
    
    # Count current usage
    current_count = 0
    if resource_type == "employees":
        result = await db.execute(
            select(func.count(Employee.id))
            .where(Employee.company_id == current_user.company_id)
        )
        current_count = result.scalar() or 0
    elif resource_type == "transactions":
        result = await db.execute(
            select(func.count(Transaction.id))
            .where(Transaction.company_id == current_user.company_id)
        )
        current_count = result.scalar() or 0
    elif resource_type == "payroll_runs":
        result = await db.execute(
            select(func.count(PayrollRun.id))
            .where(PayrollRun.company_id == current_user.company_id)
        )
        current_count = result.scalar() or 0
    elif resource_type == "messages":
        # TODO: Count from MongoDB
        current_count = 0
    
    within_limit = current_count < limit
    return within_limit, current_count, limit


def require_plan(feature: PlanTier):
    """Decorator to require a specific plan feature.
    
    Usage:
        @router.post("/employees")
        @require_plan(PlanTier.EMPLOYEES)
        async def create_employee(...):
            ...
    
    Args:
        feature: Required plan feature
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user = kwargs.get("current_user")
            db = kwargs.get("db")
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing required dependencies"
                )
            
            # Check feature access
            has_access = await check_feature_access(feature, current_user, db)
            
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"This feature requires the {feature.value} plan or higher"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_limit(resource_type: str):
    """Decorator to check resource usage limits.
    
    Usage:
        @router.post("/employees")
        @require_limit("employees")
        async def create_employee(...):
            ...
    
    Args:
        resource_type: Type of resource to check
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract dependencies from kwargs
            current_user = kwargs.get("current_user")
            db = kwargs.get("db")
            
            if not current_user or not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing required dependencies"
                )
            
            # Check usage limit
            within_limit, current_count, limit = await check_usage_limit(
                resource_type, current_user, db
            )
            
            if not within_limit:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=f"You have reached your plan limit of {limit} {resource_type}. Upgrade your plan to add more."
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Dependency to get subscription status.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        Dictionary with subscription status
    """
    subscription = await get_active_subscription(current_user, db)
    
    if not subscription:
        return {
            "has_subscription": False,
            "plan_id": PlanTier.FREE.value,
            "status": "free",
            "features": ["basic"]
        }
    
    plan_config = PLAN_CONFIGS.get(PlanTier(subscription.plan_id))
    
    return {
        "has_subscription": True,
        "plan_id": subscription.plan_id,
        "status": subscription.status,
        "features": plan_config.features if plan_config else [],
        "current_period_end": subscription.current_period_end.isoformat()
    }
