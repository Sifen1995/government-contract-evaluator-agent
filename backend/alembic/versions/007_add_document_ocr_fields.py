"""Add OCR and suggestion tracking fields to documents

Revision ID: 007_add_document_ocr_fields
Revises: 006
Create Date: 2024-12-23

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_add_document_ocr_fields'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Add OCR metadata fields
    op.add_column('documents', sa.Column('ocr_confidence', sa.Numeric(5, 2), nullable=True))
    op.add_column('documents', sa.Column('is_scanned', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('documents', sa.Column('suggestions_reviewed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('documents', 'suggestions_reviewed')
    op.drop_column('documents', 'is_scanned')
    op.drop_column('documents', 'ocr_confidence')
