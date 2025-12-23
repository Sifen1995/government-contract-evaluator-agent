"""add authority mapping tables

Revision ID: 006_authority_mapping
Revises: 005_document_management
Create Date: 2024-12-23

This migration adds tables for:
- agencies: Government agency hierarchy and metadata
- government_contacts: Agency contacts (OSDBU, contracting officers)
- company_agency_matches: Cached match scores between companies and agencies

Reference: TICKET-016 from IMPLEMENTATION_TICKETS.md
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_authority_mapping'
down_revision = '005_document_management'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create agencies table
    op.create_table('agencies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('abbreviation', sa.String(length=20), nullable=True),
        sa.Column('parent_agency_id', sa.UUID(), nullable=True),
        sa.Column('level', sa.String(length=20), nullable=True),  # department, agency, sub_agency, office
        sa.Column('sam_gov_id', sa.String(length=50), nullable=True),
        sa.Column('usaspending_id', sa.String(length=50), nullable=True),
        sa.Column('small_business_url', sa.String(length=500), nullable=True),
        sa.Column('forecast_url', sa.String(length=500), nullable=True),
        sa.Column('vendor_portal_url', sa.String(length=500), nullable=True),
        sa.Column('small_business_goal_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('eight_a_goal_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('wosb_goal_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('sdvosb_goal_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('hubzone_goal_pct', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_agency_id'], ['agencies.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_agencies_name', 'agencies', ['name'], unique=False)
    op.create_index('idx_agencies_abbreviation', 'agencies', ['abbreviation'], unique=False)
    op.create_index('idx_agencies_parent', 'agencies', ['parent_agency_id'], unique=False)
    op.create_index('idx_agencies_sam_id', 'agencies', ['sam_gov_id'], unique=False)

    # Create government_contacts table
    op.create_table('government_contacts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=True),
        sa.Column('last_name', sa.String(length=100), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('agency_id', sa.UUID(), nullable=True),
        sa.Column('office_name', sa.String(length=255), nullable=True),
        sa.Column('contact_type', sa.String(length=50), nullable=False),  # osdbu, contracting_officer, industry_liaison
        sa.Column('source', sa.String(length=50), nullable=True),  # sba_directory, sam_gov, manual
        sa.Column('source_url', sa.String(length=500), nullable=True),
        sa.Column('last_verified', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_contacts_agency', 'government_contacts', ['agency_id'], unique=False)
    op.create_index('idx_contacts_type', 'government_contacts', ['contact_type'], unique=False)
    op.create_index('idx_contacts_email', 'government_contacts', ['email'], unique=False)
    op.create_index('idx_contacts_active', 'government_contacts', ['is_active'], unique=False)

    # Create company_agency_matches table for cached scores
    op.create_table('company_agency_matches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('agency_id', sa.UUID(), nullable=False),
        sa.Column('match_score', sa.Integer(), nullable=True),
        sa.Column('naics_score', sa.Integer(), nullable=True),
        sa.Column('set_aside_score', sa.Integer(), nullable=True),
        sa.Column('geographic_score', sa.Integer(), nullable=True),
        sa.Column('award_history_score', sa.Integer(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['agency_id'], ['agencies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', 'agency_id', name='uq_company_agency_match')
    )
    op.create_index('idx_agency_matches_company', 'company_agency_matches', ['company_id'], unique=False)
    op.create_index('idx_agency_matches_agency', 'company_agency_matches', ['agency_id'], unique=False)
    op.create_index('idx_agency_matches_score', 'company_agency_matches', ['match_score'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_index('idx_agency_matches_score', table_name='company_agency_matches')
    op.drop_index('idx_agency_matches_agency', table_name='company_agency_matches')
    op.drop_index('idx_agency_matches_company', table_name='company_agency_matches')
    op.drop_table('company_agency_matches')

    op.drop_index('idx_contacts_active', table_name='government_contacts')
    op.drop_index('idx_contacts_email', table_name='government_contacts')
    op.drop_index('idx_contacts_type', table_name='government_contacts')
    op.drop_index('idx_contacts_agency', table_name='government_contacts')
    op.drop_table('government_contacts')

    op.drop_index('idx_agencies_sam_id', table_name='agencies')
    op.drop_index('idx_agencies_parent', table_name='agencies')
    op.drop_index('idx_agencies_abbreviation', table_name='agencies')
    op.drop_index('idx_agencies_name', table_name='agencies')
    op.drop_table('agencies')
