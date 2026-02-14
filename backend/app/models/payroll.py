"""Payroll management models."""

from sqlalchemy import Column, String, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin


class PayrollRun(Base, TimestampMixin):
    """Payroll run/batch model."""
    
    __tablename__ = "payroll_runs"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    status = Column(String(20), default="draft")  # draft, processing, completed, failed
    total_amount = Column(Numeric(12, 2))
    processed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="payroll_runs")
    payroll_items = relationship("PayrollItem", back_populates="payroll_run", cascade="all, delete-orphan")


class PayrollItem(Base, TimestampMixin):
    """Individual payroll item for an employee."""
    
    __tablename__ = "payroll_items"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    payroll_run_id = Column(String(36), ForeignKey("payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    base_salary = Column(Numeric(10, 2), nullable=False)
    overtime_hours = Column(Numeric(5, 2), default=0)
    overtime_amount = Column(Numeric(10, 2), default=0)
    bonuses = Column(Numeric(10, 2), default=0)
    deductions = Column(Numeric(10, 2), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    net_amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(String(20), default="pending")  # pending, paid, failed
    payment_date = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="payroll_items")
    payroll_run = relationship("PayrollRun", back_populates="payroll_items")
    employee = relationship("Employee", back_populates="payroll_items")
