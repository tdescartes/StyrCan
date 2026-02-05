"""Pydantic schemas package."""

from .auth import (
    UserCreate,
    UserUpdate,
    UserResponse,
    CompanyCreate,
    CompanyResponse,
    Token,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
)

from .employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
    EmployeeDetailResponse,
    PTOBalanceCreate,
    PTOBalanceUpdate,
    PTOBalanceResponse,
    PTORequestCreate,
    PTORequestUpdate,
    PTORequestResponse,
    ShiftCreate,
    ShiftUpdate,
    ShiftResponse,
)

from .finance import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionListResponse,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    ExpenseCategoryResponse,
    FinancialSummary,
)

from .payroll import (
    PayrollRunCreate,
    PayrollRunResponse,
    PayrollRunDetailResponse,
    PayrollItemCreate,
    PayrollItemUpdate,
    PayrollItemResponse,
    ProcessPayrollRequest,
)

__all__ = [
    # Auth
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "CompanyCreate",
    "CompanyResponse",
    "Token",
    "LoginRequest",
    "LoginResponse",
    "RefreshTokenRequest",
    # Employee
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeListResponse",
    "EmployeeDetailResponse",
    "PTOBalanceCreate",
    "PTOBalanceUpdate",
    "PTOBalanceResponse",
    "PTORequestCreate",
    "PTORequestUpdate",
    "PTORequestResponse",
    "ShiftCreate",
    "ShiftUpdate",
    "ShiftResponse",
    # Finance
    "TransactionCreate",
    "TransactionUpdate",
    "TransactionResponse",
    "TransactionListResponse",
    "ExpenseCategoryCreate",
    "ExpenseCategoryUpdate",
    "ExpenseCategoryResponse",
    "FinancialSummary",
    # Payroll
    "PayrollRunCreate",
    "PayrollRunResponse",
    "PayrollRunDetailResponse",
    "PayrollItemCreate",
    "PayrollItemUpdate",
    "PayrollItemResponse",
    "ProcessPayrollRequest",
]
