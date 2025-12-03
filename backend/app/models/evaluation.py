from sqlalchemy import Column, String, Integer, Text, TIMESTAMP, ForeignKey, CheckConstraint, UniqueConstraint, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    fit_score = Column(Integer, CheckConstraint('fit_score >= 0 AND fit_score <= 100'))
    win_probability = Column(Integer, CheckConstraint('win_probability >= 0 AND win_probability <= 100'))
    recommendation = Column(String(20))
    confidence = Column(Integer)
    reasoning = Column(Text)
    strengths = Column(ARRAY(Text))
    weaknesses = Column(ARRAY(Text))
    executive_summary = Column(Text)
    evaluated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    opportunity = relationship("Opportunity", back_populates="evaluations")
    company = relationship("Company", back_populates="evaluations")

    __table_args__ = (
        UniqueConstraint('opportunity_id', 'company_id', name='uq_evaluation_opp_company'),
    )
