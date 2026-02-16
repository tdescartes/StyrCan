"""Two-Factor Authentication schemas."""

from pydantic import BaseModel, Field
from typing import List


class TwoFASetupResponse(BaseModel):
    """Response for 2FA setup initiation."""
    secret: str = Field(..., description="TOTP secret key (base32)")
    qr_code: str = Field(..., description="QR code data URL for scanning")
    backup_codes: List[str] = Field(..., description="One-time backup codes for recovery")
    
    class Config:
        from_attributes = True


class TwoFAVerifyRequest(BaseModel):
    """Request to verify and enable 2FA."""
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")
    
    class Config:
        from_attributes = True


class TwoFALoginRequest(BaseModel):
    """Request for 2FA code during login."""
    email: str = Field(..., description="User email")
    password: str = Field(..., description="User password")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code or backup code")
    
    class Config:
        from_attributes = True


class TwoFADisableRequest(BaseModel):
    """Request to disable 2FA."""
    password: str = Field(..., description="Current password for verification")
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")
    
    class Config:
        from_attributes = True


class TwoFAStatusResponse(BaseModel):
    """Response for 2FA status check."""
    enabled: bool = Field(..., description="Whether 2FA is enabled")
    backup_codes_remaining: int = Field(..., description="Number of unused backup codes")
    
    class Config:
        from_attributes = True
