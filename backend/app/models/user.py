"""User model for authentication."""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin


class User(Base, TimestampMixin):
    """User model for authentication and authorization."""
    
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="employee")  # super_admin, company_admin, manager, employee
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    
    # Two-Factor Authentication
    twofa_enabled = Column(Boolean, default=False, nullable=False)
    twofa_secret = Column(String(32), nullable=True)  # TOTP secret key
    twofa_backup_codes = Column(String(500), nullable=True)  # JSON array of backup codes
    
    # Relationships
    company = relationship("Company", back_populates="users")
    employee = relationship("Employee", back_populates="user", uselist=False)
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")
    
    @property
    def full_name(self):
        """Return full name."""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
