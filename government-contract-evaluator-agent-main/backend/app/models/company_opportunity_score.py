"""Company opportunity score model for caching match scores."""
from sqlalchemy import Column, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class CompanyOpportunityScore(Base):
    """Cache computed match scores between companies and opportunities."""
    __tablename__ = "company_opportunity_scores"

    company_id = Column(UUID(as_uuid=True), ForeignKey('companies.id', ondelete='CASCADE'), primary_key=True)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey('opportunities.id', ondelete='CASCADE'), primary_key=True)

    # Computed scores (0-100)
    fit_score = Column(Numeric(5, 2), nullable=True)  # Overall weighted score
    naics_score = Column(Numeric(5, 2), nullable=True)  # NAICS code match
    cert_score = Column(Numeric(5, 2), nullable=True)  # Certification/set-aside match
    size_score = Column(Numeric(5, 2), nullable=True)  # Contract size fit
    geo_score = Column(Numeric(5, 2), nullable=True)  # Geographic preference match
    deadline_score = Column(Numeric(5, 2), nullable=True)  # Time to respond score

    computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="opportunity_scores")
    opportunity = relationship("Opportunity", backref="company_scores")

    def __repr__(self):
        return f"<CompanyOpportunityScore company={self.company_id} opp={self.opportunity_id} fit={self.fit_score}>"
