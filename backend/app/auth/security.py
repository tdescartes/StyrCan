"""Authentication utilities for JWT tokens and password hashing."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import logging

from ..config import settings
from ..database import get_db
from ..models.user import User

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing claims to encode in the token (should include 'sub' and 'company_id')
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        data: Dictionary containing claims to encode in the token (should include 'sub' and 'company_id')
    
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing decoded claims
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from the JWT token.
    
    This is the CRITICAL security function that:
    1. Validates JWT token signature and expiration
    2. Fetches user from database
    3. Verifies user's company_id matches token
    4. Ensures company still exists
    5. Checks user is active
    
    Args:
        token: JWT token from Authorization header
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException 401: Invalid credentials or expired token
        HTTPException 403: Inactive user, company mismatch, or deleted company
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_token(token)
    except HTTPException:
        logger.warning(f"Token decoding failed for path: {request.url.path}")
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    token_company_id: str = payload.get("company_id")
    
    if user_id is None:
        logger.warning("Token missing 'sub' claim")
        raise credentials_exception
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        logger.warning(f"User not found in DB: {user_id}")
        raise credentials_exception
    
    # CRITICAL: Verify company_id in token matches user's current company
    # This prevents token reuse if a user's company changes
    if token_company_id and token_company_id != user.company_id:
        logger.error(
            f"🚨 SECURITY: Company mismatch for user {user_id} | "
            f"Token company: {token_company_id} | "
            f"User company: {user.company_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Company context has changed. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Inject user info into request state for middleware visibility
    request.state.user = {
        "id": user.id,
        "email": user.email,
        "company_id": user.company_id,
        "role": user.role
    }
    
    # Verify company still exists (in case it was deleted)
    from ..models.company import Company
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if company is None:
        logger.error(f"Company not found: {user.company_id} for user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company no longer exists. Please contact support."
        )
    
    # Verify company is active
    if hasattr(company, 'status') and company.status != "active":
        logger.warning(f"Inactive company access attempt: {company.id} by user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company account is inactive. Please contact support."
        )
    
    # Verify user is active
    if not user.is_active:
        logger.warning(f"Inactive user access attempt: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact your administrator."
        )
    
    logger.info(f"✅ Auth successful for user {user.email} (Company: {user.company_id})")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (alias for compatibility)."""
    return current_user


def get_company_context(current_user: User = Depends(get_current_user)) -> str:
    """
    Extract company_id from authenticated user.
    
    This is the PRIMARY dependency for getting company context in route handlers.
    Use this in EVERY endpoint that needs company-scoped data filtering.
    
    Usage:
        @router.get("/employees")
        async def get_employees(
            company_id: str = Depends(get_company_context),
            db: Session = Depends(get_db)
        ):
            employees = db.query(Employee).filter(
                Employee.company_id == company_id
            ).all()
            return employees
    
    Returns:
        Company UUID string
    
    Raises:
        HTTPException 403: If user has no company_id (should never happen)
    """
    if not current_user.company_id:
        logger.error(f"User {current_user.id} has no company_id")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no company association"
        )
    
    return current_user.company_id


class RoleChecker:
    """Dependency class for checking user roles."""
    
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles
    
    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user


# Role-based dependencies
require_admin = RoleChecker(["company_admin", "super_admin"])
require_manager = RoleChecker(["manager", "company_admin", "super_admin"])
require_employee = RoleChecker(["employee", "manager", "company_admin", "super_admin"])
