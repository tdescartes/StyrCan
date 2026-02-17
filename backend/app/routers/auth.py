"""Authentication router for login, register, and token management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Company, Employee
from ..schemas.auth import (
    CompanyCreate,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    Token,
    UserResponse,
    CompanyResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UserUpdate,
)
from ..schemas.twofa import (
    TwoFASetupResponse,
    TwoFAVerifyRequest,
    TwoFADisableRequest,
    TwoFAStatusResponse,
)
from ..auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)

router = APIRouter()


def _build_user_response(user: User, db: Session) -> UserResponse:
    """Build UserResponse including the linked employee_id if it exists."""
    employee = db.query(Employee).filter(
        Employee.user_id == user.id,
        Employee.company_id == user.company_id
    ).first()
    
    response = UserResponse.model_validate(user)
    if employee:
        response.employee_id = employee.id
    return response


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new company with an admin user.
    
    This endpoint creates both a company and its first admin user.
    """
    # Check if company email already exists
    existing_company = db.query(Company).filter(Company.email == company_data.email).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this email already exists"
        )
    
    # Check if admin email already exists
    existing_user = db.query(User).filter(User.email == company_data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create company
    company = Company(
        id=str(uuid.uuid4()),
        name=company_data.name,
        email=company_data.email,
        phone=company_data.phone,
        address=company_data.address,
        tax_id=company_data.tax_id,
        status="active"
    )
    db.add(company)
    db.flush()  # Flush to get the company ID
    
    # Create admin user
    admin_user = User(
        id=str(uuid.uuid4()),
        company_id=company.id,
        email=company_data.admin_email,
        hashed_password=get_password_hash(company_data.admin_password),
        first_name=company_data.admin_first_name,
        last_name=company_data.admin_last_name,
        role="company_admin",
        is_active=True,
        last_login=datetime.utcnow()
    )
    db.add(admin_user)
    
    try:
        db.commit()
        db.refresh(company)
        db.refresh(admin_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating company: {str(e)}"
        )
    
    # Generate tokens
    access_token = create_access_token(data={
        "sub": str(admin_user.id),
        "company_id": str(company.id),
        "role": admin_user.role
    })
    refresh_token = create_refresh_token(data={
        "sub": str(admin_user.id),
        "company_id": str(company.id),
        "role": admin_user.role
    })
    
    return LoginResponse(
        user=_build_user_response(admin_user, db),
        company=CompanyResponse.model_validate(company),
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Get company
    company = db.query(Company).filter(Company.id == user.company_id).first()
    
    # Generate tokens
    access_token = create_access_token(data={
        "sub": str(user.id),
        "company_id": str(user.company_id),
        "role": user.role
    })
    refresh_token = create_refresh_token(data={
        "sub": str(user.id),
        "company_id": str(user.company_id),
        "role": user.role
    })
    
    return LoginResponse(
        user=_build_user_response(user, db),
        company=CompanyResponse.model_validate(company),
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using a refresh token.
    """
    try:
        payload = decode_token(refresh_data.refresh_token)
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Verify user exists and is active
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new tokens
        new_access_token = create_access_token(data={
            "sub": str(user.id),
            "company_id": str(user.company_id),
            "role": user.role
        })
        new_refresh_token = create_refresh_token(data={
            "sub": str(user.id),
            "company_id": str(user.company_id),
            "role": user.role
        })
        
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user information.
    """
    return _build_user_response(current_user, db)


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard tokens).
    """
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email.
    
    Sends an email with a reset token to the user's email address.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {
            "success": True,
            "message": "If an account exists with that email, a password reset link has been sent"
        }
    
    # Generate a password reset token (valid for 1 hour)
    from datetime import timedelta
    reset_token = create_access_token(
        data={"sub": str(user.id), "purpose": "password_reset"},
        expires_delta=timedelta(hours=1)
    )
    
    # Send password reset email
    from app.utils.email import EmailService
    from app.config import settings
    
    frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:3000"
    email_sent = await EmailService.send_password_reset(
        to_email=user.email,
        reset_token=reset_token,
        frontend_url=frontend_url
    )
    
    if not email_sent:
        # Log warning but don't reveal to user
        import logging
        logging.getLogger(__name__).warning(f"Failed to send password reset email to {user.email}")
    
    return {
        "success": True,
        "message": "If an account exists with that email, a password reset link has been sent"
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password using a reset token.
    """
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    try:
        payload = decode_token(request.token)
        
        # Verify token type
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        
        # Get user and update password
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.hashed_password = get_password_hash(request.new_password)
        db.commit()
        
        return {
            "success": True,
            "message": "Password has been reset successfully"
        }
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change password for the current authenticated user.
    """
    # Validate passwords match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile information.
    """
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Don't allow users to change their own role or active status through this endpoint
    update_data.pop("role", None)
    update_data.pop("is_active", None)
    
    # Check if email is being changed and if it's already taken
    if "email" in update_data and update_data["email"] != current_user.email:
        existing_user = db.query(User).filter(User.email == update_data["email"]).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
    
    # Update user fields
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


# -------------------- Two-Factor Authentication Endpoints --------------------

@router.post("/2fa/setup", response_model=TwoFASetupResponse)
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initiate 2FA setup for the current user.
    
    Returns TOTP secret, QR code, and backup codes.
    User must verify with a code before 2FA is enabled.
    """
    from ..utils.twofa import TwoFAService
    
    if current_user.twofa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled. Disable it first to reset."
        )
    
    # Generate 2FA setup data
    secret, qr_code, backup_codes = TwoFAService.setup_2fa(current_user.email)
    
    # Store secret temporarily (not enabled until verified)
    current_user.twofa_secret = secret
    current_user.twofa_backup_codes = TwoFAService.serialize_backup_codes(backup_codes)
    db.commit()
    
    return TwoFASetupResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=backup_codes
    )


@router.post("/2fa/verify")
async def verify_2fa(
    request: TwoFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify 2FA code and enable 2FA for the user.
    """
    from ..utils.twofa import TwoFAService
    
    if current_user.twofa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is already enabled"
        )
    
    if not current_user.twofa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup not initiated. Call /api/auth/2fa/setup first."
        )
    
    # Verify code
    if not TwoFAService.verify_code(current_user.twofa_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Enable 2FA
    current_user.twofa_enabled = True
    db.commit()
    
    return {
        "success": True,
        "message": "Two-factor authentication enabled successfully"
    }


@router.post("/2fa/disable")
async def disable_2fa(
    request: TwoFADisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable 2FA for the current user.
    
    Requires current password and valid 2FA code.
    """
    from ..utils.twofa import TwoFAService
    
    if not current_user.twofa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled"
        )
    
    # Verify password
    if not verify_password(request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Verify 2FA code
    if not TwoFAService.verify_code(current_user.twofa_secret, request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Disable 2FA and clear secrets
    current_user.twofa_enabled = False
    current_user.twofa_secret = None
    current_user.twofa_backup_codes = None
    db.commit()
    
    return {
        "success": True,
        "message": "Two-factor authentication disabled successfully"
    }


@router.get("/2fa/status", response_model=TwoFAStatusResponse)
async def get_2fa_status(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's 2FA status.
    """
    from ..utils.twofa import TwoFAService
    
    backup_codes_remaining = 0
    if current_user.twofa_enabled and current_user.twofa_backup_codes:
        backup_codes_remaining = TwoFAService.count_remaining_backup_codes(
            current_user.twofa_backup_codes
        )
    
    return TwoFAStatusResponse(
        enabled=current_user.twofa_enabled,
        backup_codes_remaining=backup_codes_remaining
    )
