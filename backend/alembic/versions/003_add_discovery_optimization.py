"""Add discovery optimization tables and fields

Revision ID: 003_discovery_optimization
Revises: 002_add_opportunities_evaluations
Create Date: 2025-12-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

# revision identifiers, used by Alembic.
revision = '003_discovery_optimization'
down_revision = '002_add_opportunities_evaluations'
branch_labels = None
depends_on = None


def upgrade():
    # Create discovery_runs table for tracking discovery jobs
    op.create_table(
        'discovery_runs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Numeric(10, 2), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='running'),

        # Search parameters
        sa.Column('naics_codes', ARRAY(sa.String), nullable=True),
        sa.Column('posted_from', sa.Date, nullable=True),
        sa.Column('posted_to', sa.Date, nullable=True),

        # Results
        sa.Column('api_calls_made', sa.Integer, server_default='0'),
        sa.Column('opportunities_found', sa.Integer, server_default='0'),
        sa.Column('opportunities_new', sa.Integer, server_default='0'),
        sa.Column('opportunities_updated', sa.Integer, server_default='0'),
        sa.Column('opportunities_unchanged', sa.Integer, server_default='0'),
        sa.Column('evaluations_created', sa.Integer, server_default='0'),

        # Errors
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('error_details', JSONB, nullable=True),

        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
    )

    # Add index for finding last successful run
    op.create_index(
        'idx_discovery_runs_status_completed',
        'discovery_runs',
        ['status', sa.text('completed_at DESC')],
        postgresql_where=sa.text("status = 'completed'")
    )

    # Add evaluation_status and generic_evaluation to opportunities table
    op.add_column('opportunities', sa.Column('evaluation_status', sa.String(20), server_default='pending'))
    op.add_column('opportunities', sa.Column('generic_evaluation', JSONB, nullable=True))
    op.add_column('opportunities', sa.Column('evaluated_at', sa.DateTime(timezone=True), nullable=True))

    # Add index for finding unevaluated opportunities
    op.create_index(
        'idx_opportunities_eval_status',
        'opportunities',
        ['evaluation_status']
    )

    # Create company_opportunity_scores table for caching match scores
    op.create_table(
        'company_opportunity_scores',
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('opportunity_id', UUID(as_uuid=True), sa.ForeignKey('opportunities.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('fit_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('naics_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('cert_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('size_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('geo_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('deadline_score', sa.Numeric(5, 2), nullable=True),
        sa.Column('computed_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
    )

    # Add index for fast lookups
    op.create_index(
        'idx_company_opportunity_scores_opportunity',
        'company_opportunity_scores',
        ['opportunity_id']
    )


def downgrade():
    op.drop_index('idx_company_opportunity_scores_opportunity', table_name='company_opportunity_scores')
    op.drop_table('company_opportunity_scores')
    op.drop_index('idx_opportunities_eval_status', table_name='opportunities')
    op.drop_column('opportunities', 'evaluated_at')
    op.drop_column('opportunities', 'generic_evaluation')
    op.drop_column('opportunities', 'evaluation_status')
    op.drop_index('idx_discovery_runs_status_completed', table_name='discovery_runs')
    op.drop_table('discovery_runs')
