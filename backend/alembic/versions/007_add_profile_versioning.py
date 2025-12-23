"""add profile versioning

Revision ID: 007_profile_versioning
Revises: 006_authority_mapping
Create Date: 2024-12-23

This migration adds profile versioning to support dynamic re-scoring:
- companies.profile_version: Tracks profile changes
- evaluations.profile_version_at_evaluation: Links evaluation to profile version

Reference: TICKET-026 from IMPLEMENTATION_TICKETS.md
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_profile_versioning'
down_revision = '006_authority_mapping'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add profile_version to companies table
    op.add_column('companies', sa.Column('profile_version', sa.Integer(), server_default='1', nullable=False))

    # Add profile_version_at_evaluation to evaluations table
    op.add_column('evaluations', sa.Column('profile_version_at_evaluation', sa.Integer(), nullable=True))

    # Create index for stale evaluation queries
    op.create_index(
        'idx_evaluations_profile_version',
        'evaluations',
        ['company_id', 'profile_version_at_evaluation'],
        unique=False
    )

    # Backfill existing evaluations with version 0 (to mark as potentially stale)
    op.execute("UPDATE evaluations SET profile_version_at_evaluation = 0 WHERE profile_version_at_evaluation IS NULL")


def downgrade() -> None:
    op.drop_index('idx_evaluations_profile_version', table_name='evaluations')
    op.drop_column('evaluations', 'profile_version_at_evaluation')
    op.drop_column('companies', 'profile_version')
