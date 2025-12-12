from sqlalchemy import Column, String, DateTime, Text, DECIMAL, JSON, ForeignKey, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(CHAR(36), primary_key=True, default=generate_uuid)

    # Foreign keys
    opportunity_id = Column(CHAR(36), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(CHAR(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)

    # AI Scoring (0-100 scale)
    fit_score = Column(DECIMAL(5, 2), nullable=False)  # How well company matches opportunity (0-100)
    win_probability = Column(DECIMAL(5, 2), nullable=False)  # Estimated probability of winning (0-100)

    # AI Recommendation
    recommendation = Column(String(20), nullable=False, index=True)  # "BID", "NO_BID", "RESEARCH"

    # AI Analysis
    strengths = Column(JSON, default=list, nullable=True)  # List of strengths (why company is a good fit)
    weaknesses = Column(JSON, default=list, nullable=True)  # List of weaknesses (why company might struggle)
    key_requirements = Column(JSON, default=list, nullable=True)  # Key requirements extracted from opportunity
    missing_capabilities = Column(JSON, default=list, nullable=True)  # Capabilities company lacks

    # Detailed reasoning
    reasoning = Column(Text, nullable=True)  # Full AI explanation
    risk_factors = Column(JSON, default=list, nullable=True)  # List of risk factors

    # Match details
    naics_match = Column(Integer, default=0, nullable=False)  # 0 = no match, 1 = partial, 2 = exact
    set_aside_match = Column(Integer, default=0, nullable=False)  # 0 = no match, 1 = match
    geographic_match = Column(Integer, default=0, nullable=False)  # 0 = no match, 1 = match
    contract_value_match = Column(Integer, default=0, nullable=False)  # 0 = too large/small, 1 = within range

    # AI model metadata
    model_version = Column(String(50), nullable=True)  # e.g., "gpt-4", "gpt-4-turbo"
    tokens_used = Column(Integer, nullable=True)
    evaluation_time_seconds = Column(DECIMAL(8, 2), nullable=True)

    # User interaction (Week 4+)
    user_saved = Column(String(20), nullable=True)  # "WATCHING", "BIDDING", "PASSED", null = not saved
    user_notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="evaluations")
    company = relationship("Company")

    def __repr__(self):
        return f"<Evaluation {self.id}: {self.recommendation} ({self.fit_score}% fit)>"
