"""Employee-related models."""

from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Integer, Text, DateTime
from sqlalchemy.orm import relationship
from ..database import Base
from .base import TimestampMixin


class Employee(Base, TimestampMixin):
    """Employee model."""
    
    __tablename__ = "employees"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20))
    position = Column(String(100))
    department = Column(String(100))
    hire_date = Column(Date, nullable=False)
    employment_type = Column(String(20))  # full-time, part-time, contract
    status = Column(String(20), default="active", index=True)
    salary_amount = Column(Numeric(10, 2))
    
    # Relationships
    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee")
    pto_balances = relationship("PTOBalance", back_populates="employee", cascade="all, delete-orphan")
    pto_requests = relationship("PTORequest", back_populates="employee", cascade="all, delete-orphan")
    shifts = relationship("Shift", back_populates="employee", cascade="all, delete-orphan")
    payroll_items = relationship("PayrollItem", back_populates="employee")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class PTOBalance(Base, TimestampMixin):
    """PTO (Paid Time Off) balance tracking."""
    
    __tablename__ = "pto_balances"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    total_days = Column(Numeric(5, 2), nullable=False)
    used_days = Column(Numeric(5, 2), default=0)
    available_days = Column(Numeric(5, 2))
    
    # Relationships
    company = relationship("Company", back_populates="pto_balances")
    employee = relationship("Employee", back_populates="pto_balances")


class PTORequest(Base, TimestampMixin):
    """PTO request model."""
    
    __tablename__ = "pto_requests"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_requested = Column(Numeric(5, 2), nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")  # pending, approved, denied
    reviewed_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Relationships
    company = relationship("Company", back_populates="pto_requests")
    employee = relationship("Employee", back_populates="pto_requests")


class Shift(Base, TimestampMixin):
    """Employee shift/schedule model."""
    
    __tablename__ = "shifts"
    
    id = Column(String(36), primary_key=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_date = Column(Date, nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, completed, missed, cancelled
    notes = Column(Text)
    
    # Relationships
    company = relationship("Company", back_populates="shifts")
    employee = relationship("Employee", back_populates="shifts")
