"""Add subscriptions table and Stripe fields to companies

Revision ID: 005
Revises: 004
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add subscriptions table and Stripe integration fields."""
    
    # 1. Add Stripe fields to companies table
    op.add_column('companies', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('companies', sa.Column('stripe_subscription_id', sa.String(255), nullable=True))
    
    # Add unique indexes for Stripe IDs
    op.create_index('ix_companies_stripe_customer_id', 'companies', ['stripe_customer_id'], unique=True)
    op.create_index('ix_companies_stripe_subscription_id', 'companies', ['stripe_subscription_id'], unique=True)
    
    # 2. Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=False),
        sa.Column('stripe_customer_id', sa.String(255), nullable=False),
        sa.Column('plan_id', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('canceled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trial_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('extra_data', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes and constraints for subscriptions
    op.create_index('ix_subscriptions_company_id', 'subscriptions', ['company_id'])
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'], unique=True)
    op.create_index('ix_subscriptions_stripe_customer_id', 'subscriptions', ['stripe_customer_id'])
    op.create_index('ix_subscriptions_status', 'subscriptions', ['status'])
    
    # Add foreign key to companies (company_id is String(36) in companies table)
    # Note: We're not adding FK constraint since company_id types might differ (UUID vs String)
    # This will be handled at application level


def downgrade() -> None:
    """Remove subscriptions table and Stripe fields."""
    
    # Drop subscriptions table
    op.drop_index('ix_subscriptions_status', 'subscriptions')
    op.drop_index('ix_subscriptions_stripe_customer_id', 'subscriptions')
    op.drop_index('ix_subscriptions_stripe_subscription_id', 'subscriptions')
    op.drop_index('ix_subscriptions_company_id', 'subscriptions')
    op.drop_table('subscriptions')
    
    # Remove Stripe fields from companies
    op.drop_index('ix_companies_stripe_subscription_id', 'companies')
    op.drop_index('ix_companies_stripe_customer_id', 'companies')
    op.drop_column('companies', 'stripe_subscription_id')
    op.drop_column('companies', 'stripe_customer_id')
