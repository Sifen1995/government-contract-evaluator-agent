"""Add opportunities and evaluations tables

Revision ID: 002
Revises: 001
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create opportunities table
    op.create_table(
        'opportunities',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('notice_id', sa.String(255), nullable=False),
        sa.Column('solicitation_number', sa.String(255), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('department', sa.String(255), nullable=True),
        sa.Column('sub_tier', sa.String(255), nullable=True),
        sa.Column('office', sa.String(255), nullable=True),
        sa.Column('naics_code', sa.String(10), nullable=True),
        sa.Column('naics_description', sa.String(255), nullable=True),
        sa.Column('psc_code', sa.String(10), nullable=True),
        sa.Column('set_aside', sa.String(100), nullable=True),
        sa.Column('contract_value', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('contract_value_min', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('contract_value_max', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('posted_date', sa.DateTime(), nullable=True),
        sa.Column('response_deadline', sa.DateTime(), nullable=True),
        sa.Column('archive_date', sa.DateTime(), nullable=True),
        sa.Column('place_of_performance_city', sa.String(100), nullable=True),
        sa.Column('place_of_performance_state', sa.String(2), nullable=True),
        sa.Column('place_of_performance_zip', sa.String(10), nullable=True),
        sa.Column('place_of_performance_country', sa.String(3), nullable=True),
        sa.Column('primary_contact_name', sa.String(255), nullable=True),
        sa.Column('primary_contact_email', sa.String(255), nullable=True),
        sa.Column('primary_contact_phone', sa.String(50), nullable=True),
        sa.Column('link', sa.String(500), nullable=True),
        sa.Column('attachment_links', sa.JSON(), nullable=True),
        sa.Column('type', sa.String(50), nullable=True),
        sa.Column('award_number', sa.String(255), nullable=True),
        sa.Column('award_amount', sa.DECIMAL(15, 2), nullable=True),
        sa.Column('raw_data', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('last_synced_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('notice_id')
    )

    # Create indexes for opportunities
    op.create_index('ix_opportunities_notice_id', 'opportunities', ['notice_id'], unique=True)
    op.create_index('ix_opportunities_solicitation_number', 'opportunities', ['solicitation_number'], unique=False)
    op.create_index('ix_opportunities_naics_code', 'opportunities', ['naics_code'], unique=False)
    op.create_index('ix_opportunities_response_deadline', 'opportunities', ['response_deadline'], unique=False)
    op.create_index('ix_opportunities_state', 'opportunities', ['place_of_performance_state'], unique=False)

    # Create evaluations table
    op.create_table(
        'evaluations',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('opportunity_id', mysql.CHAR(36), nullable=False),
        sa.Column('company_id', mysql.CHAR(36), nullable=False),
        sa.Column('fit_score', sa.DECIMAL(5, 2), nullable=False),
        sa.Column('win_probability', sa.DECIMAL(5, 2), nullable=False),
        sa.Column('recommendation', sa.String(20), nullable=False),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('weaknesses', sa.JSON(), nullable=True),
        sa.Column('key_requirements', sa.JSON(), nullable=True),
        sa.Column('missing_capabilities', sa.JSON(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('risk_factors', sa.JSON(), nullable=True),
        sa.Column('naics_match', sa.Integer(), nullable=False),
        sa.Column('set_aside_match', sa.Integer(), nullable=False),
        sa.Column('geographic_match', sa.Integer(), nullable=False),
        sa.Column('contract_value_match', sa.Integer(), nullable=False),
        sa.Column('model_version', sa.String(50), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('evaluation_time_seconds', sa.DECIMAL(8, 2), nullable=True),
        sa.Column('user_saved', sa.String(20), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for evaluations
    op.create_index('ix_evaluations_opportunity_id', 'evaluations', ['opportunity_id'], unique=False)
    op.create_index('ix_evaluations_company_id', 'evaluations', ['company_id'], unique=False)
    op.create_index('ix_evaluations_recommendation', 'evaluations', ['recommendation'], unique=False)


def downgrade() -> None:
    # Drop indexes for evaluations
    op.drop_index('ix_evaluations_recommendation', table_name='evaluations')
    op.drop_index('ix_evaluations_company_id', table_name='evaluations')
    op.drop_index('ix_evaluations_opportunity_id', table_name='evaluations')

    # Drop evaluations table
    op.drop_table('evaluations')

    # Drop indexes for opportunities
    op.drop_index('ix_opportunities_state', table_name='opportunities')
    op.drop_index('ix_opportunities_response_deadline', table_name='opportunities')
    op.drop_index('ix_opportunities_naics_code', table_name='opportunities')
    op.drop_index('ix_opportunities_solicitation_number', table_name='opportunities')
    op.drop_index('ix_opportunities_notice_id', table_name='opportunities')

    # Drop opportunities table
    op.drop_table('opportunities')
