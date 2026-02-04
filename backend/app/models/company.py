"""Company model."""

from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin


class Company(Base, TimestampMixin):
    """Company/Organization model."""
    
    __tablename__ = "companies"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    address = Column(Text)
    tax_id = Column(String(50))
    status = Column(String(20), default="active")
    
    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="company", cascade="all, delete-orphan")
    expense_categories = relationship("ExpenseCategory", back_populates="company", cascade="all, delete-orphan")
    payroll_runs = relationship("PayrollRun", back_populates="company", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="company", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name})>"
