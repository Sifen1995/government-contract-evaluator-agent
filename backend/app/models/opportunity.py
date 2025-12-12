from sqlalchemy import Column, String, DateTime, Text, DECIMAL, JSON, Boolean, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(CHAR(36), primary_key=True, default=generate_uuid)

    # SAM.gov identifiers
    notice_id = Column(String(255), unique=True, nullable=False, index=True)  # SAM.gov notice ID
    solicitation_number = Column(String(255), nullable=True, index=True)

    # Basic information
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    department = Column(String(255), nullable=True)  # e.g., "Department of Defense"
    sub_tier = Column(String(255), nullable=True)  # e.g., "Department of the Navy"
    office = Column(String(255), nullable=True)  # e.g., "NAVAIR"

    # Classification
    naics_code = Column(String(10), nullable=True, index=True)
    naics_description = Column(String(255), nullable=True)
    psc_code = Column(String(10), nullable=True)  # Product Service Code
    set_aside = Column(String(100), nullable=True)  # e.g., "8(a)", "WOSB", "Small Business"

    # Financial
    contract_value = Column(DECIMAL(15, 2), nullable=True)
    contract_value_min = Column(DECIMAL(15, 2), nullable=True)
    contract_value_max = Column(DECIMAL(15, 2), nullable=True)

    # Dates
    posted_date = Column(DateTime, nullable=True)
    response_deadline = Column(DateTime, nullable=True, index=True)
    archive_date = Column(DateTime, nullable=True)

    # Location
    place_of_performance_city = Column(String(100), nullable=True)
    place_of_performance_state = Column(String(2), nullable=True, index=True)
    place_of_performance_zip = Column(String(10), nullable=True)
    place_of_performance_country = Column(String(3), nullable=True)

    # Contact
    primary_contact_name = Column(String(255), nullable=True)
    primary_contact_email = Column(String(255), nullable=True)
    primary_contact_phone = Column(String(50), nullable=True)

    # Links and attachments
    link = Column(String(500), nullable=True)  # SAM.gov URL
    attachment_links = Column(JSON, default=list, nullable=True)  # List of attachment URLs

    # Additional data
    type = Column(String(50), nullable=True)  # "Solicitation", "Award", "Pre-solicitation", etc.
    award_number = Column(String(255), nullable=True)
    award_amount = Column(DECIMAL(15, 2), nullable=True)

    # Raw data from SAM.gov (for debugging/future use)
    raw_data = Column(JSON, nullable=True)

    # Status tracking
    is_active = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    evaluations = relationship("Evaluation", back_populates="opportunity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Opportunity {self.notice_id}: {self.title[:50]}>"
