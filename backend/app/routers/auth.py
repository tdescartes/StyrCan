"""Authentication router for login, register, and token management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Company
from ..schemas.auth import (
    CompanyCreate,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    Token,
    UserResponse,
    CompanyResponse,
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
    access_token = create_access_token(data={"sub": admin_user.id})
    refresh_token = create_refresh_token(data={"sub": admin_user.id})
    
    return LoginResponse(
        user=UserResponse.from_orm(admin_user),
        company=CompanyResponse.from_orm(company),
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
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    return LoginResponse(
        user=UserResponse.from_orm(user),
        company=CompanyResponse.from_orm(company),
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
        new_access_token = create_access_token(data={"sub": user_id})
        new_refresh_token = create_refresh_token(data={"sub": user_id})
        
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
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse.from_orm(current_user)


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard tokens).
    """
    return {"message": "Successfully logged out"}
