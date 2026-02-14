"""Add company_id to PayrollItem, PTOBalance, PTORequest, and Shift tables

Revision ID: 002
Revises: 001
Create Date: 2026-02-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add company_id to child tables for direct company isolation security."""
    
    # 1. Add company_id column to payroll_items (nullable initially)
    op.add_column('payroll_items', sa.Column('company_id', sa.String(36), nullable=True))
    
    # Backfill company_id from payroll_runs
    op.execute("""
        UPDATE payroll_items pi
        SET company_id = pr.company_id
        FROM payroll_runs pr
        WHERE pi.payroll_run_id = pr.id
    """)
    
    # Make column NOT NULL and add constraints
    op.alter_column('payroll_items', 'company_id', nullable=False)
    op.create_foreign_key('fk_payroll_items_company', 'payroll_items', 'companies', ['company_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_payroll_items_company_id', 'payroll_items', ['company_id'])
    
    # 2. Add company_id column to pto_balances (nullable initially)
    op.add_column('pto_balances', sa.Column('company_id', sa.String(36), nullable=True))
    
    # Backfill company_id from employees
    op.execute("""
        UPDATE pto_balances pb
        SET company_id = e.company_id
        FROM employees e
        WHERE pb.employee_id = e.id
    """)
    
    # Make column NOT NULL and add constraints
    op.alter_column('pto_balances', 'company_id', nullable=False)
    op.create_foreign_key('fk_pto_balances_company', 'pto_balances', 'companies', ['company_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_pto_balances_company_id', 'pto_balances', ['company_id'])
    
    # 3. Add company_id column to pto_requests (nullable initially)
    op.add_column('pto_requests', sa.Column('company_id', sa.String(36), nullable=True))
    
    # Backfill company_id from employees
    op.execute("""
        UPDATE pto_requests pr
        SET company_id = e.company_id
        FROM employees e
        WHERE pr.employee_id = e.id
    """)
    
    # Make column NOT NULL and add constraints
    op.alter_column('pto_requests', 'company_id', nullable=False)
    op.create_foreign_key('fk_pto_requests_company', 'pto_requests', 'companies', ['company_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_pto_requests_company_id', 'pto_requests', ['company_id'])
    
    # 4. Add company_id column to shifts (nullable initially)
    op.add_column('shifts', sa.Column('company_id', sa.String(36), nullable=True))
    
    # Backfill company_id from employees
    op.execute("""
        UPDATE shifts s
        SET company_id = e.company_id
        FROM employees e
        WHERE s.employee_id = e.id
    """)
    
    # Make column NOT NULL and add constraints
    op.alter_column('shifts', 'company_id', nullable=False)
    op.create_foreign_key('fk_shifts_company', 'shifts', 'companies', ['company_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_shifts_company_id', 'shifts', ['company_id'])


def downgrade() -> None:
    """Remove company_id from child tables."""
    
    # Remove from payroll_items
    op.drop_index('ix_payroll_items_company_id', 'payroll_items')
    op.drop_constraint('fk_payroll_items_company', 'payroll_items', type_='foreignkey')
    op.drop_column('payroll_items', 'company_id')
    
    # Remove from pto_balances
    op.drop_index('ix_pto_balances_company_id', 'pto_balances')
    op.drop_constraint('fk_pto_balances_company', 'pto_balances', type_='foreignkey')
    op.drop_column('pto_balances', 'company_id')
    
    # Remove from pto_requests
    op.drop_index('ix_pto_requests_company_id', 'pto_requests')
    op.drop_constraint('fk_pto_requests_company', 'pto_requests', type_='foreignkey')
    op.drop_column('pto_requests', 'company_id')
    
    # Remove from shifts
    op.drop_index('ix_shifts_company_id', 'shifts')
    op.drop_constraint('fk_shifts_company', 'shifts', type_='foreignkey')
    op.drop_column('shifts', 'company_id')
