"""Discovery run model for tracking SAM.gov API discovery jobs."""
from sqlalchemy import Column, String, Integer, DateTime, Date, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime
import uuid
from app.core.database import Base


class DiscoveryRun(Base):
    """Track each discovery job run for monitoring and incremental fetching."""
    __tablename__ = "discovery_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), nullable=False, default='running')
    # Status values: 'running', 'completed', 'failed', 'partial'

    # Search parameters
    naics_codes = Column(ARRAY(String), nullable=True)
    posted_from = Column(Date, nullable=True)
    posted_to = Column(Date, nullable=True)

    # Results
    api_calls_made = Column(Integer, default=0)
    opportunities_found = Column(Integer, default=0)
    opportunities_new = Column(Integer, default=0)
    opportunities_updated = Column(Integer, default=0)
    opportunities_unchanged = Column(Integer, default=0)
    evaluations_created = Column(Integer, default=0)

    # Errors
    error_message = Column(Text, nullable=True)
    error_details = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    def __repr__(self):
        return f"<DiscoveryRun {self.id} status={self.status} found={self.opportunities_found}>"
