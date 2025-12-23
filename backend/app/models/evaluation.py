from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, ARRAY, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # AI Scoring (0-100 scale as integers)
    fit_score = Column(Integer, nullable=True)  # How well company matches opportunity (0-100)
    win_probability = Column(Integer, nullable=True)  # Estimated probability of winning (0-100)

    # AI Recommendation
    recommendation = Column(String(20), nullable=True, index=True)  # "BID", "NO_BID", "RESEARCH"
    confidence = Column(Integer, nullable=True)  # Confidence level (0-100)

    # AI Analysis
    reasoning = Column(Text, nullable=True)  # Full AI explanation
    strengths = Column(ARRAY(Text), nullable=True)  # List of strengths
    weaknesses = Column(ARRAY(Text), nullable=True)  # List of weaknesses
    executive_summary = Column(Text, nullable=True)  # Brief summary

    # Financial Analysis (GovRat parity)
    estimated_profit = Column(Numeric(15, 2), nullable=True)  # Estimated profit amount
    profit_margin_percentage = Column(Numeric(5, 2), nullable=True)  # Profit margin %
    cost_breakdown = Column(JSONB, nullable=True)  # Task-level cost breakdown

    # User Pipeline Status
    user_saved = Column(String(20), nullable=True, index=True)  # "WATCHING", "BIDDING", "PASSED", "WON", "LOST"
    user_notes = Column(Text, nullable=True)  # User notes for pipeline

    # Profile Version Tracking (for dynamic re-scoring)
    profile_version_at_evaluation = Column(Integer, nullable=True)  # Profile version when evaluation was created

    # Timestamp
    evaluated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="evaluations")
    company = relationship("Company")

    # Aliases for backward compatibility
    @property
    def created_at(self):
        return self.evaluated_at

    @property
    def updated_at(self):
        return self.evaluated_at

    def __repr__(self):
        return f"<Evaluation {self.id}: {self.recommendation} ({self.fit_score}% fit)>"

    @property
    def is_stale(self) -> bool:
        """Check if evaluation is based on an old profile version."""
        if self.profile_version_at_evaluation is None:
            return True  # Legacy evaluation without version tracking
        if not self.company:
            return False
        return self.profile_version_at_evaluation < self.company.profile_version
