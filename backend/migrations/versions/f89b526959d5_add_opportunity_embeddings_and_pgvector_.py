"""Add opportunity embeddings and pgvector support

Revision ID: f89b526959d5
Revises: b899d26a5e3e
Create Date: 2025-12-03 07:16:11.489263

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'f89b526959d5'
down_revision = 'b899d26a5e3e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if pgvector extension is available
    conn = op.get_bind()
    result = conn.execute(text("""
        SELECT EXISTS(
            SELECT 1 FROM pg_extension WHERE extname = 'vector'
        );
    """))
    pgvector_available = result.scalar()

    if pgvector_available:
        print("pgvector extension found - creating embeddings table")
        # Use raw SQL to avoid import issues with pgvector
        conn.execute(text("""
            CREATE TABLE opportunity_embeddings (
                id UUID NOT NULL DEFAULT gen_random_uuid(),
                opportunity_id UUID NOT NULL,
                embedding VECTOR(1536) NOT NULL,
                embedded_text TEXT,
                keywords TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                PRIMARY KEY (id),
                FOREIGN KEY(opportunity_id) REFERENCES opportunities (id) ON DELETE CASCADE,
                UNIQUE (opportunity_id)
            )
        """))
    else:
        print("WARNING: pgvector extension not available - skipping embeddings table")
        print("Embeddings functionality will not be available until pgvector is enabled")


def downgrade() -> None:
    # Check if table exists before dropping
    conn = op.get_bind()
    result = conn.execute(text("""
        SELECT EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'opportunity_embeddings'
        );
    """))
    table_exists = result.scalar()

    if table_exists:
        op.drop_table('opportunity_embeddings')
