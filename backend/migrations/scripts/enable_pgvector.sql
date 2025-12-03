-- Enable pgvector extension for vector similarity search
-- Run this manually after creating the database:
-- psql -d govai -f migrations/scripts/enable_pgvector.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Create index on embeddings for faster similarity search
-- This will be created after running alembic migrations
-- CREATE INDEX ON opportunity_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
