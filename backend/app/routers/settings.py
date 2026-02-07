"""Settings router for company management, user management, and billing."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
import uuid

from ..database import get_db
from ..models import Company, User
from ..schemas.auth import UserResponse, CompanyResponse, UserUpdate
from ..auth import get_current_user, require_admin, get_password_hash

router = APIRouter()


# ============== Company Settings ==============

class CompanyUpdate(BaseModel):
    """Schema for updating company information."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None


@router.get("/company", response_model=CompanyResponse)
async def get_company(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get company details."""
    company = db.query(Company).filter(
        Company.id == current_user["company_id"]
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return CompanyResponse.from_orm(company)


@router.put("/company", response_model=CompanyResponse)
async def update_company(
    company_update: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update company information (admin only)."""
    company = db.query(Company).filter(
        Company.id == current_user["company_id"]
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    update_data = company_update.model_dump(exclude_unset=True)
    
    # Check if email is being changed and if it's already taken
    if "email" in update_data and update_data["email"] != company.email:
        existing = db.query(Company).filter(Company.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
    
    for field, value in update_data.items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    
    return CompanyResponse.from_orm(company)


# ============== User Management ==============

class UserInvite(BaseModel):
    """Schema for inviting a new user."""
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "employee"  # employee, manager, company_admin


class UserListResponse(BaseModel):
    """Schema for user list response."""
    users: List[UserResponse]
    total: int


@router.get("/users", response_model=UserListResponse)
async def get_company_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get all users in the company (admin only)."""
    users = db.query(User).filter(
        User.company_id == current_user["company_id"]
    ).all()
    
    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=len(users)
    )


@router.post("/users/invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    invite_data: UserInvite,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Invite a new user to the company (admin only)."""
    # Check if user already exists
    existing = db.query(User).filter(User.email == invite_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create temporary password (in production, send invitation email)
    temp_password = f"temp_{uuid.uuid4().hex[:8]}"
    
    user = User(
        id=str(uuid.uuid4()),
        company_id=current_user["company_id"],
        email=invite_data.email,
        hashed_password=get_password_hash(temp_password),
        first_name=invite_data.first_name,
        last_name=invite_data.last_name,
        role=invite_data.role,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # TODO: Send invitation email with temp password
    
    return UserResponse.from_orm(user)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a user (admin only)."""
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user["company_id"]
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow changing own role or status
    if user.id == current_user["id"]:
        user_update.role = None
        user_update.is_active = None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check email uniqueness
    if "email" in update_data and update_data["email"] != user.email:
        existing = db.query(User).filter(User.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Delete a user from the company (admin only)."""
    # Don't allow deleting yourself
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == current_user["company_id"]
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()


# ============== Billing & Subscription ==============

class SubscriptionInfo(BaseModel):
    """Schema for subscription information."""
    plan: str
    status: str
    billing_cycle: str
    next_billing_date: Optional[datetime]
    features: List[str]


class BillingInfo(BaseModel):
    """Schema for billing information."""
    subscription: SubscriptionInfo
    payment_method: Optional[str]
    billing_email: str


@router.get("/billing", response_model=BillingInfo)
async def get_billing_info(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get billing and subscription information (admin only)."""
    company = db.query(Company).filter(
        Company.id == current_user["company_id"]
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Mock subscription data (would come from billing provider)
    subscription = SubscriptionInfo(
        plan="standard",
        status="active",
        billing_cycle="monthly",
        next_billing_date=datetime.utcnow(),
        features=[
            "Employee Management",
            "Finance Tracking",
            "Payroll Processing",
            "Basic Reporting"
        ]
    )
    
    return BillingInfo(
        subscription=subscription,
        payment_method="Visa ending in 4242",
        billing_email=company.email
    )


class ChangePlanRequest(BaseModel):
    """Schema for changing subscription plan."""
    new_plan: str  # standard, professional, enterprise


@router.post("/billing/change-plan")
async def change_plan(
    plan_request: ChangePlanRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Change subscription plan (admin only)."""
    # Mock implementation - would integrate with payment processor
    return {
        "success": True,
        "message": f"Plan change to {plan_request.new_plan} initiated",
        "effective_date": datetime.utcnow().isoformat()
    }


# ============== Notification Preferences ==============

class NotificationPreferences(BaseModel):
    """Schema for notification preferences."""
    email_notifications: bool = True
    pto_requests: bool = True
    payroll_processed: bool = True
    new_messages: bool = True
    employee_updates: bool = True


@router.get("/notifications/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """Get user's notification preferences."""
    # Mock implementation - would store in user preferences table
    return NotificationPreferences(
        email_notifications=True,
        pto_requests=True,
        payroll_processed=True,
        new_messages=True,
        employee_updates=True
    )


@router.put("/notifications/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification preferences."""
    # Mock implementation - would update user preferences in database
    return preferences
