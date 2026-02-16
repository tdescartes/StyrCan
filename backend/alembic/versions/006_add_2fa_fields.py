"""Add 2FA fields to users table

Revision ID: 006
Revises: 005
Create Date: 2026-02-16

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add two-factor authentication fields to users table."""
    
    # Add 2FA fields
    op.add_column('users', sa.Column('twofa_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('twofa_secret', sa.String(32), nullable=True))
    op.add_column('users', sa.Column('twofa_backup_codes', sa.String(500), nullable=True))


def downgrade() -> None:
    """Remove two-factor authentication fields from users table."""
    
    op.drop_column('users', 'twofa_backup_codes')
    op.drop_column('users', 'twofa_secret')
    op.drop_column('users', 'twofa_enabled')
