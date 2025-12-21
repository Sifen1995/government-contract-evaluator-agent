# from sqlalchemy import Column, String, DateTime, Text, Numeric, Boolean, Integer
# from sqlalchemy.dialects.postgresql import UUID, JSONB
# from sqlalchemy.orm import relationship
# from datetime import datetime
# import uuid
# from app.core.database import Base


# class Opportunity(Base):
#     __tablename__ = "opportunities"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

#     # Source identifiers
#     source = Column(String(50), nullable=False, default="sam.gov")
#     source_id = Column(String(100), nullable=False, index=True)  # SAM.gov notice ID
#     solicitation_number = Column(String(100), nullable=True, index=True)
#     #normalization needed for the new requirement
#     issuing_agency = Column(String(255))
#     is_forecast = Column(Boolean, default=False)
#     posted_date = Column(DateTime, nullable=True)
#     due_date = Column(DateTime, nullable=True)

#     # Basic information
#     title = Column(Text, nullable=False)
#     description = Column(Text, nullable=True)
#     notice_type = Column(String(50), nullable=True)  # Solicitation, Award, Pre-solicitation
#     agency = Column(String(255), nullable=True)  # e.g., "Department of Defense"
#     sub_agency = Column(String(255), nullable=True)  # e.g., "Department of the Navy"
#     office = Column(String(255), nullable=True)  # e.g., "NAVAIR"

#     # Classification
#     naics_code = Column(String(6), nullable=True, index=True)
#     psc_code = Column(String(10), nullable=True)  # Product Service Code
#     set_aside_type = Column(String(50), nullable=True, index=True)  # e.g., "8(a)", "WOSB", "Small Business"

#     # Location (Place of Performance)
#     pop_city = Column(String(100), nullable=True)
#     pop_state = Column(String(2), nullable=True)
#     pop_zip = Column(String(10), nullable=True)

#     # Dates
#     posted_date = Column(DateTime(timezone=True), nullable=True)
#     response_deadline = Column(DateTime(timezone=True), nullable=True, index=True)

#     # Financial
#     estimated_value_low = Column(Numeric, nullable=True)
#     estimated_value_high = Column(Numeric, nullable=True)

#     # Contact
#     contact_name = Column(String(255), nullable=True)
#     contact_email = Column(String(255), nullable=True)
#     contact_phone = Column(String(50), nullable=True)

#     # Links and attachments
#     source_url = Column(Text, nullable=True)  # SAM.gov URL
#     attachments = Column(JSONB, nullable=True)  # List of attachment URLs

#     # Status tracking
#     status = Column(String(20), nullable=True, index=True, default="active")

#     # Generic evaluation tracking (company-agnostic)
#     evaluation_status = Column(String(20), nullable=True, index=True, default="pending")  # pending, evaluated, skipped
#     generic_evaluation = Column(JSONB, nullable=True)  # AI evaluation results (opportunity quality, complexity, etc.)

#     # Raw data from SAM.gov (for debugging/future use)
#     raw_data = Column(JSONB, nullable=True)

#     # Timestamps
#     created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=True)
#     updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

#     # Relationships
#     evaluations = relationship("Evaluation", back_populates="opportunity", cascade="all, delete-orphan")

#     # Aliases for backward compatibility with existing code
#     @property
#     def notice_id(self):
#         return self.source_id

#     @property
#     def department(self):
#         return self.agency

#     @property
#     def sub_tier(self):
#         return self.sub_agency

#     @property
#     def set_aside(self):
#         return self.set_aside_type

#     @property
#     def place_of_performance_city(self):
#         return self.pop_city

#     @property
#     def place_of_performance_state(self):
#         return self.pop_state

#     @property
#     def place_of_performance_zip(self):
#         return self.pop_zip

#     @property
#     def primary_contact_name(self):
#         return self.contact_name

#     @property
#     def primary_contact_email(self):
#         return self.contact_email

#     @property
#     def primary_contact_phone(self):
#         return self.contact_phone

#     @property
#     def link(self):
#         return self.source_url

#     @property
#     def is_active(self):
#         return self.status == "active"

#     @property
#     def contract_value(self):
#         """Return estimated value high as contract value"""
#         return self.estimated_value_high

#     @property
#     def type(self):
#         return self.notice_type

#     @property
#     def naics_description(self):
#         """Return NAICS description from raw_data if available"""
#         if self.raw_data and isinstance(self.raw_data, dict):
#             return self.raw_data.get('classificationCode') or self.raw_data.get('naicsDescription')
#         return None

#     def __repr__(self):
#         return f"<Opportunity {self.source_id}: {self.title[:50] if self.title else 'No title'}>"


# backend/app/models/opportunity.py

from sqlalchemy import (
    Column, String, DateTime, Text, Numeric,
    Boolean, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    # --------------------
    # Identity
    # --------------------
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    source = Column(String(50), nullable=False)  
    source_id = Column(String(255), nullable=False, index=True)
    source_type = Column(String(50), nullable=True)  # opportunity | forecast

    # --------------------
    # Agency Normalization
    # --------------------
    issuing_agency = Column(String(255), nullable=True, index=True)
    issuing_sub_agency = Column(String(255), nullable=True)
    issuing_office = Column(String(255), nullable=True)

    # --------------------
    # Forecast Support
    # --------------------
    is_forecast = Column(Boolean, default=False, index=True)
    forecast_fiscal_year = Column(String(10), nullable=True)
    forecast_quarter = Column(String(10), nullable=True)
    forecast_estimated_release = Column(DateTime(timezone=True), nullable=True)

    # --------------------
    # Core Information
    # --------------------
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    notice_type = Column(String(50), nullable=True)

    # --------------------
    # Classification
    # --------------------
    naics_code = Column(String(6), nullable=True, index=True)
    psc_code = Column(String(10), nullable=True)
    set_aside_type = Column(String(50), nullable=True, index=True)

    # --------------------
    # Location
    # --------------------
    pop_city = Column(String(100), nullable=True)
    pop_state = Column(String(2), nullable=True)
    pop_zip = Column(String(10), nullable=True)

    # --------------------
    # Dates
    # --------------------
    posted_date = Column(DateTime(timezone=True), nullable=True)
    response_deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    # --------------------
    # Financials
    # --------------------
    estimated_value_low = Column(Numeric, nullable=True)
    estimated_value_high = Column(Numeric, nullable=True)
    estimated_value_text = Column(String(255), nullable=True)

    # --------------------
    # Contact
    # --------------------
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)

    # --------------------
    # Links & Attachments
    # --------------------
    source_url = Column(Text, nullable=True)
    attachments = Column(JSONB, nullable=True)

    # --------------------
    # Status & Evaluation
    # --------------------
    status = Column(String(20), default="active", index=True)
    evaluation_status = Column(String(20), default="pending", index=True)
    generic_evaluation = Column(JSONB, nullable=True)

    # --------------------
    # Provenance
    # --------------------
    ingestion_run_id = Column(UUID(as_uuid=True), nullable=True)
    raw_source = Column(String(50), nullable=True)
    raw_data = Column(JSONB, nullable=True)

    # --------------------
    # Timestamps
    # --------------------
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # --------------------
    # Relationships
    # --------------------
    evaluations = relationship("Evaluation", back_populates="opportunity", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_opportunity_source_id"),
        Index("idx_opportunity_source", "source"),
    )

    def __repr__(self):
        return f"<Opportunity {self.source}:{self.source_id} {self.title[:50]}>"

