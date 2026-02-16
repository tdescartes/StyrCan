"""Two-Factor Authentication service using TOTP (Time-based One-Time Password)."""

import pyotp
import qrcode
import io
import base64
import json
import secrets
from typing import List, Tuple


class TwoFAService:
    """Service for handling two-factor authentication operations."""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret key.
        
        Returns:
            Base32-encoded secret key
        """
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(secret: str, user_email: str, issuer_name: str = "Pulse") -> str:
        """Generate QR code for TOTP setup.
        
        Args:
            secret: TOTP secret key (base32)
            user_email: User's email address
            issuer_name: Name of the application
            
        Returns:
            Data URL for QR code image (base64-encoded PNG)
        """
        # Create TOTP URI
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(
            name=user_email,
            issuer_name=issuer_name
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        # Convert to image bytes
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Encode as base64 data URL
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    
    @staticmethod
    def verify_code(secret: str, code: str, window: int = 1) -> bool:
        """Verify a TOTP code.
        
        Args:
            secret: TOTP secret key (base32)
            code: 6-digit code to verify
            window: Number of time windows to check (allows for clock drift)
            
        Returns:
            True if code is valid, False otherwise
        """
        if not code or len(code) != 6 or not code.isdigit():
            return False
        
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=window)
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """Generate single-use backup codes for recovery.
        
        Args:
            count: Number of backup codes to generate
            
        Returns:
            List of alphanumeric backup codes (8 characters each)
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = ''.join(secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') for _ in range(8))
            codes.append(code)
        return codes
    
    @staticmethod
    def serialize_backup_codes(codes: List[str]) -> str:
        """Serialize backup codes for database storage.
        
        Args:
            codes: List of backup codes
            
        Returns:
            JSON string of backup codes
        """
        return json.dumps(codes)
    
    @staticmethod
    def deserialize_backup_codes(codes_json: str) -> List[str]:
        """Deserialize backup codes from database.
        
        Args:
            codes_json: JSON string of backup codes
            
        Returns:
            List of backup codes
        """
        if not codes_json:
            return []
        return json.loads(codes_json)
    
    @staticmethod
    def verify_backup_code(stored_codes_json: str, provided_code: str) -> Tuple[bool, str]:
        """Verify and consume a backup code.
        
        Args:
            stored_codes_json: JSON string of backup codes from database
            provided_code: Backup code provided by user
            
        Returns:
            Tuple of (is_valid, updated_codes_json)
        """
        codes = TwoFAService.deserialize_backup_codes(stored_codes_json)
        
        # Check if code exists
        if provided_code.upper() not in [code.upper() for code in codes]:
            return False, stored_codes_json
        
        # Remove used code
        codes = [code for code in codes if code.upper() != provided_code.upper()]
        
        # Return updated list
        return True, TwoFAService.serialize_backup_codes(codes)
    
    @staticmethod
    def count_remaining_backup_codes(codes_json: str) -> int:
        """Count remaining unused backup codes.
        
        Args:
            codes_json: JSON string of backup codes
            
        Returns:
            Number of remaining backup codes
        """
        codes = TwoFAService.deserialize_backup_codes(codes_json)
        return len(codes)
    
    @staticmethod
    def setup_2fa(user_email: str) -> Tuple[str, str, List[str]]:
        """Complete 2FA setup process for a user.
        
        Args:
            user_email: User's email address
            
        Returns:
            Tuple of (secret, qr_code_data_url, backup_codes)
        """
        secret = TwoFAService.generate_secret()
        qr_code = TwoFAService.generate_qr_code(secret, user_email)
        backup_codes = TwoFAService.generate_backup_codes()
        
        return secret, qr_code, backup_codes
