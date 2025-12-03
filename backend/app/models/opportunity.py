from sqlalchemy import Column, String, Text, DECIMAL, TIMESTAMP, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(50), nullable=False, default="SAM")
    source_id = Column(String(100), nullable=False)
    solicitation_number = Column(String(100))
    title = Column(Text, nullable=False)
    description = Column(Text)
    notice_type = Column(String(50))
    agency = Column(String(255))
    sub_agency = Column(String(255))
    office = Column(String(255))
    naics_code = Column(String(6), index=True)
    psc_code = Column(String(10))
    set_aside_type = Column(String(50), index=True)
    pop_city = Column(String(100))
    pop_state = Column(String(2))
    pop_zip = Column(String(10))
    posted_date = Column(TIMESTAMP(timezone=True))
    response_deadline = Column(TIMESTAMP(timezone=True), index=True)
    estimated_value_low = Column(DECIMAL)
    estimated_value_high = Column(DECIMAL)
    contact_name = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    source_url = Column(Text)
    attachments = Column(JSONB, default=[])
    status = Column(String(20), default="active", index=True)
    raw_data = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    evaluations = relationship("Evaluation", back_populates="opportunity", cascade="all, delete-orphan")
    saved_by_users = relationship("SavedOpportunity", back_populates="opportunity", cascade="all, delete-orphan")
    dismissed_by_users = relationship("DismissedOpportunity", back_populates="opportunity", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('source', 'source_id', name='uq_source_source_id'),
        Index('idx_opp_naics', 'naics_code'),
        Index('idx_opp_set_aside', 'set_aside_type'),
        Index('idx_opp_deadline', 'response_deadline'),
        Index('idx_opp_status', 'status'),
    )
