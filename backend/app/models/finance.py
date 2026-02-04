"""Financial management models."""

from sqlalchemy import Column, String, Numeric, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin


class Transaction(Base, TimestampMixin):
    """Financial transaction model."""
    
    __tablename__ = "transactions"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # income, expense
    category = Column(String(100))
    amount = Column(Numeric(12, 2), nullable=False)
    description = Column(Text)
    transaction_date = Column(Date, nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="transactions")


class ExpenseCategory(Base, TimestampMixin):
    """Expense category for budgeting."""
    
    __tablename__ = "expense_categories"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    budget_limit = Column(Numeric(12, 2))
    
    # Relationships
    company = relationship("Company", back_populates="expense_categories")
