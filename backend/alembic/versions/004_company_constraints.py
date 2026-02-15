"""Add company-scoped unique constraints and indexes for multi-tenancy.

Revision ID: 004_company_constraints
Revises: 003_company_indexes
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_company_constraints'
down_revision = '003_company_indexes'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add composite unique constraints and additional indexes for multi-tenancy.
    
    These constraints ensure:
    1. Email uniqueness is scoped per company (employees can have same email across companies)
    2. Fast queries when filtering by company_id + other fields
    3. Database-level enforcement of data isolation
    """
    
    # ========== Users Table ==========
    # Email should be unique per company (user can't register twice in same company)
    # But same email can exist across different companies
    op.drop_constraint('users_email_key', 'users', type_='unique')
    op.create_unique_constraint(
        'uq_users_company_email',
        'users',
        ['company_id', 'email']
    )
    
    # Index for fast company-scoped queries
    op.create_index(
        'ix_users_company_created',
        'users',
        ['company_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'ix_users_company_role',
        'users',
        ['company_id', 'role'],
        unique=False
    )
    
    # ========== Employees Table ==========
    # Email should be unique per company
    op.create_unique_constraint(
        'uq_employees_company_email',
        'employees',
        ['company_id', 'email']
    )
    
    # Employee number should be unique per company (if used)
    # op.create_unique_constraint(
    #     'uq_employees_company_employee_number',
    #     'employees',
    #     ['company_id', 'employee_number']
    # )
    
    # Indexes for common queries
    op.create_index(
        'ix_employees_company_status',
        'employees',
        ['company_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'ix_employees_company_department',
        'employees',
        ['company_id', 'department'],
        unique=False
    )
    
    op.create_index(
        'ix_employees_company_hire_date',
        'employees',
        ['company_id', 'hire_date'],
        unique=False
    )
    
    # ========== Transactions Table ==========
    # Transaction reference should be unique per company (if used)
    # op.create_unique_constraint(
    #     'uq_transactions_company_reference',
    #     'transactions',
    #     ['company_id', 'reference_number']
    # )
    
    # Indexes for financial queries
    op.create_index(
        'ix_transactions_company_date',
        'transactions',
        ['company_id', 'transaction_date'],
        unique=False
    )
    
    op.create_index(
        'ix_transactions_company_type',
        'transactions',
        ['company_id', 'transaction_type'],
        unique=False
    )
    
    op.create_index(
        'ix_transactions_company_status',
        'transactions',
        ['company_id', 'status'],
        unique=False
    )
    
    # ========== Payroll Runs Table ==========
    # Payroll period should be unique per company (can't run payroll twice for same period)
    op.create_unique_constraint(
        'uq_payroll_runs_company_period',
        'payroll_runs',
        ['company_id', 'pay_period_start', 'pay_period_end']
    )
    
    # Index for payroll queries
    op.create_index(
        'ix_payroll_runs_company_status',
        'payroll_runs',
        ['company_id', 'status'],
        unique=False
    )
    
    # ========== PTO Requests Table ==========
    # Index for PTO approval workflow
    op.create_index(
        'ix_pto_requests_company_status',
        'pto_requests',
        ['company_id', 'status'],
        unique=False
    )
    
    op.create_index(
        'ix_pto_requests_company_dates',
        'pto_requests',
        ['company_id', 'start_date', 'end_date'],
        unique=False
    )
    
    # ========== Shifts Table ==========
    # Index for shift scheduling
    op.create_index(
        'ix_shifts_company_date',
        'shifts',
        ['company_id', 'shift_date'],
        unique=False
    )
    
    op.create_index(
        'ix_shifts_company_employee',
        'shifts',
        ['company_id', 'employee_id'],
        unique=False
    )
    
    # ========== Messages Table ==========
    # Index for messaging queries
    op.create_index(
        'ix_messages_company_sender',
        'messages',
        ['company_id', 'sender_id', 'created_at'],
        unique=False
    )
    
    op.create_index(
        'ix_messages_company_recipient',
        'messages',
        ['company_id', 'recipient_id', 'is_read'],
        unique=False
    )


def downgrade():
    """Remove company-scoped constraints and indexes."""
    
    # ========== Users Table ==========
    op.drop_constraint('uq_users_company_email', 'users', type_='unique')
    op.create_unique_constraint('users_email_key', 'users', ['email'])
    op.drop_index('ix_users_company_created', 'users')
    op.drop_index('ix_users_company_role', 'users')
    
    # ========== Employees Table ==========
    op.drop_constraint('uq_employees_company_email', 'employees', type_='unique')
    op.drop_index('ix_employees_company_status', 'employees')
    op.drop_index('ix_employees_company_department', 'employees')
    op.drop_index('ix_employees_company_hire_date', 'employees')
    
    # ========== Transactions Table ==========
    op.drop_index('ix_transactions_company_date', 'transactions')
    op.drop_index('ix_transactions_company_type', 'transactions')
    op.drop_index('ix_transactions_company_status', 'transactions')
    
    # ========== Payroll Runs Table ==========
    op.drop_constraint('uq_payroll_runs_company_period', 'payroll_runs', type_='unique')
    op.drop_index('ix_payroll_runs_company_status', 'payroll_runs')
    
    # ========== PTO Requests Table ==========
    op.drop_index('ix_pto_requests_company_status', 'pto_requests')
    op.drop_index('ix_pto_requests_company_dates', 'pto_requests')
    
    # ========== Shifts Table ==========
    op.drop_index('ix_shifts_company_date', 'shifts')
    op.drop_index('ix_shifts_company_employee', 'shifts')
    
    # ========== Messages Table ==========
    op.drop_index('ix_messages_company_sender', 'messages')
    op.drop_index('ix_messages_company_recipient', 'messages')
