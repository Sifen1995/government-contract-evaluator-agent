"""Opportunity Embeddings Model - Vector storage for semantic search"""
from sqlalchemy import Column, Text, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from ..core.database import Base


class OpportunityEmbedding(Base):
    """Store vector embeddings for semantic similarity search"""
    __tablename__ = "opportunity_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding = Column(Vector(1536), nullable=False)

    # Store the text that was embedded for reference
    embedded_text = Column(Text)

    # Extracted keywords for faster filtering
    keywords = Column(Text)  # Comma-separated keywords

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    opportunity = relationship("Opportunity", back_populates="embedding")
