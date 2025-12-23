"""add document management tables

Revision ID: 005_document_management
Revises: 163cc5606836
Create Date: 2024-12-23

This migration adds tables for:
- documents: Core document storage metadata
- document_versions: Version history for documents
- certification_documents: Certification tracking with expiration
- past_performance: Past performance records

Reference: TICKET-002 from IMPLEMENTATION_TICKETS.md
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_document_management'
down_revision = '163cc5606836'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create documents table
    op.create_table('documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),  # capability_statement, certification, past_performance, other
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=20), nullable=False),  # pdf, docx, doc
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('s3_bucket', sa.String(length=100), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('extracted_entities', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('extraction_status', sa.String(length=20), server_default='pending', nullable=False),  # pending, processing, completed, failed
        sa.Column('is_deleted', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_documents_company', 'documents', ['company_id'], unique=False)
    op.create_index('idx_documents_type', 'documents', ['document_type'], unique=False)
    op.create_index('idx_documents_extraction_status', 'documents', ['extraction_status'], unique=False)

    # Create document_versions table
    op.create_table('document_versions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('s3_key', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=False),  # SHA-256
        sa.Column('uploaded_by', sa.UUID(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_current', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_doc_versions_document', 'document_versions', ['document_id'], unique=False)
    op.create_index('idx_doc_versions_current', 'document_versions', ['document_id', 'is_current'], unique=False)

    # Create certification_documents table
    op.create_table('certification_documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('certification_type', sa.String(length=50), nullable=False),  # 8(a), WOSB, SDVOSB, HUBZone, etc.
        sa.Column('document_id', sa.UUID(), nullable=True),
        sa.Column('issued_date', sa.Date(), nullable=True),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='active', nullable=False),  # active, expired, pending_renewal
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_cert_docs_company', 'certification_documents', ['company_id'], unique=False)
    op.create_index('idx_cert_docs_expiration', 'certification_documents', ['expiration_date'], unique=False)
    op.create_index('idx_cert_docs_status', 'certification_documents', ['status'], unique=False)

    # Create past_performance table
    op.create_table('past_performance',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=True),
        sa.Column('contract_number', sa.String(length=100), nullable=True),
        sa.Column('agency_name', sa.String(length=255), nullable=True),
        sa.Column('contract_value', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('pop_start', sa.Date(), nullable=True),  # Period of Performance start
        sa.Column('pop_end', sa.Date(), nullable=True),  # Period of Performance end
        sa.Column('naics_codes', postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column('performance_rating', sa.String(length=50), nullable=True),  # Exceptional, Very Good, Satisfactory, etc.
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ai_extracted_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_past_perf_company', 'past_performance', ['company_id'], unique=False)
    op.create_index('idx_past_perf_naics', 'past_performance', ['naics_codes'], unique=False, postgresql_using='gin')


def downgrade() -> None:
    # Drop tables in reverse order due to foreign key constraints
    op.drop_index('idx_past_perf_naics', table_name='past_performance')
    op.drop_index('idx_past_perf_company', table_name='past_performance')
    op.drop_table('past_performance')

    op.drop_index('idx_cert_docs_status', table_name='certification_documents')
    op.drop_index('idx_cert_docs_expiration', table_name='certification_documents')
    op.drop_index('idx_cert_docs_company', table_name='certification_documents')
    op.drop_table('certification_documents')

    op.drop_index('idx_doc_versions_current', table_name='document_versions')
    op.drop_index('idx_doc_versions_document', table_name='document_versions')
    op.drop_table('document_versions')

    op.drop_index('idx_documents_extraction_status', table_name='documents')
    op.drop_index('idx_documents_type', table_name='documents')
    op.drop_index('idx_documents_company', table_name='documents')
    op.drop_table('documents')
