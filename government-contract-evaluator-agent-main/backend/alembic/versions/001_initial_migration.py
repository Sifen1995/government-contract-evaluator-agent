"""Initial migration - users and companies tables

Revision ID: 001
Revises:
Create Date: 2025-12-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('legal_structure', sa.String(50), nullable=True),
        sa.Column('address_street', sa.String(255), nullable=True),
        sa.Column('address_city', sa.String(100), nullable=True),
        sa.Column('address_state', sa.String(2), nullable=True),
        sa.Column('address_zip', sa.String(10), nullable=True),
        sa.Column('uei', sa.String(12), nullable=True),
        sa.Column('naics_codes', sa.JSON(), nullable=False),
        sa.Column('set_asides', sa.JSON(), nullable=True),
        sa.Column('capabilities', sa.Text(), nullable=True),
        sa.Column('contract_value_min', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('contract_value_max', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('geographic_preferences', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email_verified', sa.Boolean(), nullable=False),
        sa.Column('verification_token', sa.String(255), nullable=True),
        sa.Column('verification_token_expires', sa.DateTime(), nullable=True),
        sa.Column('password_reset_token', sa.String(255), nullable=True),
        sa.Column('password_reset_expires', sa.DateTime(), nullable=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('company_id', mysql.CHAR(36), nullable=True),
        sa.Column('email_frequency', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # Create indexes
    op.create_index('ix_users_email', 'users', ['email'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
    op.drop_table('companies')
