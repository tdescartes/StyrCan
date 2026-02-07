"""Initial database schema

Revision ID: 001
Revises: 
Create Date: 2026-02-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('phone', sa.String(20)),
        sa.Column('address', sa.Text),
        sa.Column('tax_id', sa.String(50)),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, default='employee'),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('last_login', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create employees table
    op.create_table(
        'employees',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('position', sa.String(100)),
        sa.Column('department', sa.String(100)),
        sa.Column('hire_date', sa.Date, nullable=False),
        sa.Column('employment_type', sa.String(20)),
        sa.Column('status', sa.String(20), default='active', index=True),
        sa.Column('salary_amount', sa.Numeric(10, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create pto_balances table
    op.create_table(
        'pto_balances',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('employee_id', sa.String(36), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('year', sa.Integer, nullable=False),
        sa.Column('total_days', sa.Numeric(5, 2), nullable=False),
        sa.Column('used_days', sa.Numeric(5, 2), default=0),
        sa.Column('available_days', sa.Numeric(5, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create pto_requests table
    op.create_table(
        'pto_requests',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('employee_id', sa.String(36), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('start_date', sa.Date, nullable=False),
        sa.Column('end_date', sa.Date, nullable=False),
        sa.Column('days_requested', sa.Numeric(5, 2), nullable=False),
        sa.Column('reason', sa.Text),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('reviewed_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reviewed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create shifts table
    op.create_table(
        'shifts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('employee_id', sa.String(36), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('shift_date', sa.Date, nullable=False, index=True),
        sa.Column('start_time', sa.DateTime, nullable=False),
        sa.Column('end_time', sa.DateTime, nullable=False),
        sa.Column('status', sa.String(20), default='scheduled'),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('category', sa.String(100)),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('transaction_date', sa.Date, nullable=False, index=True),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create expense_categories table
    op.create_table(
        'expense_categories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('budget_limit', sa.Numeric(12, 2)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create payroll_runs table
    op.create_table(
        'payroll_runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('period_start', sa.Date, nullable=False),
        sa.Column('period_end', sa.Date, nullable=False),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('total_amount', sa.Numeric(12, 2)),
        sa.Column('processed_by', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('processed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create payroll_items table
    op.create_table(
        'payroll_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('payroll_run_id', sa.String(36), sa.ForeignKey('payroll_runs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('employee_id', sa.String(36), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('base_salary', sa.Numeric(10, 2), nullable=False),
        sa.Column('overtime_hours', sa.Numeric(5, 2), default=0),
        sa.Column('overtime_rate', sa.Numeric(5, 2), default=1.5),
        sa.Column('overtime_amount', sa.Numeric(10, 2), default=0),
        sa.Column('bonuses', sa.Numeric(10, 2), default=0),
        sa.Column('deductions', sa.Numeric(10, 2), default=0),
        sa.Column('tax_amount', sa.Numeric(10, 2), default=0),
        sa.Column('net_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('payment_status', sa.String(20), default='pending'),
        sa.Column('payment_date', sa.DateTime, nullable=True),
        sa.Column('paid_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('sender_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('company_id', sa.String(36), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('message_type', sa.String(20), default='direct'),
        sa.Column('subject', sa.String(255)),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('is_read', sa.Boolean, default=False, index=True),
        sa.Column('sent_at', sa.DateTime, nullable=False),
        sa.Column('read_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    )


def downgrade() -> None:
    op.drop_table('messages')
    op.drop_table('payroll_items')
    op.drop_table('payroll_runs')
    op.drop_table('expense_categories')
    op.drop_table('transactions')
    op.drop_table('shifts')
    op.drop_table('pto_requests')
    op.drop_table('pto_balances')
    op.drop_table('employees')
    op.drop_table('users')
    op.drop_table('companies')
