"""
Agency and Contact Models

Models for government agency hierarchy, contacts, and company-agency matching.

Reference: TICKET-017 from IMPLEMENTATION_TICKETS.md
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Agency(Base):
    """
    Government agency with hierarchy support.
    Stores agency metadata, small business goals, and resource links.
    """
    __tablename__ = "agencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    abbreviation = Column(String(20), nullable=True)

    # Hierarchy
    parent_agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="SET NULL"), nullable=True)
    level = Column(String(20), nullable=True)  # department, agency, sub_agency, office

    # External identifiers
    sam_gov_id = Column(String(50), nullable=True)
    usaspending_id = Column(String(50), nullable=True)

    # Resource URLs
    small_business_url = Column(String(500), nullable=True)
    forecast_url = Column(String(500), nullable=True)
    vendor_portal_url = Column(String(500), nullable=True)

    # Small business goals (percentages)
    small_business_goal_pct = Column(Numeric(5, 2), nullable=True)
    eight_a_goal_pct = Column(Numeric(5, 2), nullable=True)
    wosb_goal_pct = Column(Numeric(5, 2), nullable=True)
    sdvosb_goal_pct = Column(Numeric(5, 2), nullable=True)
    hubzone_goal_pct = Column(Numeric(5, 2), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    parent = relationship("Agency", remote_side=[id], backref="children")
    contacts = relationship("GovernmentContact", back_populates="agency")
    company_matches = relationship("CompanyAgencyMatch", back_populates="agency")

    def __repr__(self):
        return f"<Agency {self.abbreviation or self.name}>"

    @property
    def full_hierarchy(self) -> list:
        """Get full hierarchy path from root to this agency."""
        path = [self]
        current = self
        while current.parent:
            path.insert(0, current.parent)
            current = current.parent
        return path


class GovernmentContact(Base):
    """
    Government contracting contact.
    Tracks OSDBU directors, contracting officers, and industry liaisons.
    """
    __tablename__ = "government_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Personal info
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    title = Column(String(255), nullable=True)

    # Contact info
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    # Organization
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="SET NULL"), nullable=True)
    office_name = Column(String(255), nullable=True)

    # Role type: osdbu, contracting_officer, industry_liaison
    contact_type = Column(String(50), nullable=False)

    # Data source tracking
    source = Column(String(50), nullable=True)  # sba_directory, sam_gov, manual
    source_url = Column(String(500), nullable=True)
    last_verified = Column(DateTime(timezone=True), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="contacts")

    def __repr__(self):
        return f"<GovernmentContact {self.first_name} {self.last_name} ({self.contact_type})>"

    @property
    def full_name(self) -> str:
        """Get full name of contact."""
        parts = [p for p in [self.first_name, self.last_name] if p]
        return " ".join(parts) if parts else "Unknown"


class CompanyAgencyMatch(Base):
    """
    Cached match scores between companies and agencies.
    Pre-calculated for performance on dashboard recommendations.
    """
    __tablename__ = "company_agency_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    agency_id = Column(UUID(as_uuid=True), ForeignKey("agencies.id", ondelete="CASCADE"), nullable=False)

    # Overall match score (0-100)
    match_score = Column(Integer, nullable=True)

    # Component scores (0-100 each)
    naics_score = Column(Integer, nullable=True)
    set_aside_score = Column(Integer, nullable=True)
    geographic_score = Column(Integer, nullable=True)
    award_history_score = Column(Integer, nullable=True)

    # Explanation
    reasoning = Column(Text, nullable=True)

    # When calculated
    calculated_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="agency_matches")
    agency = relationship("Agency", back_populates="company_matches")

    def __repr__(self):
        return f"<CompanyAgencyMatch {self.company_id} -> {self.agency_id}: {self.match_score}>"
