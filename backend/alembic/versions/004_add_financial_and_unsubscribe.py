"""Add financial analysis fields to evaluations and unsubscribe token to users

Revision ID: 004_financial_unsubscribe
Revises: 2f10671d14f6
Create Date: 2025-12-22

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '004_financial_unsubscribe'
down_revision = '2f10671d14f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add financial analysis fields to evaluations table
    op.add_column('evaluations', sa.Column('estimated_profit', sa.Numeric(15, 2), nullable=True))
    op.add_column('evaluations', sa.Column('profit_margin_percentage', sa.Numeric(5, 2), nullable=True))
    op.add_column('evaluations', sa.Column('cost_breakdown', JSONB, nullable=True))

    # Add unsubscribe token to users table
    op.add_column('users', sa.Column('unsubscribe_token', sa.String(64), nullable=True))
    op.create_unique_constraint('uq_users_unsubscribe_token', 'users', ['unsubscribe_token'])
    op.create_index('ix_users_unsubscribe_token', 'users', ['unsubscribe_token'])


def downgrade() -> None:
    # Remove unsubscribe token from users table
    op.drop_index('ix_users_unsubscribe_token', table_name='users')
    op.drop_constraint('uq_users_unsubscribe_token', 'users', type_='unique')
    op.drop_column('users', 'unsubscribe_token')

    # Remove financial analysis fields from evaluations table
    op.drop_column('evaluations', 'cost_breakdown')
    op.drop_column('evaluations', 'profit_margin_percentage')
    op.drop_column('evaluations', 'estimated_profit')
