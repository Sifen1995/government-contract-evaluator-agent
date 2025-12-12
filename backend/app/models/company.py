from sqlalchemy import Column, String, DateTime, Text, DECIMAL, JSON
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Company(Base):
    __tablename__ = "companies"

    id = Column(CHAR(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    legal_structure = Column(String(50), nullable=True)  # LLC, Corp, Sole Prop, Partnership
    address_street = Column(String(255), nullable=True)
    address_city = Column(String(100), nullable=True)
    address_state = Column(String(2), nullable=True)
    address_zip = Column(String(10), nullable=True)
    uei = Column(String(12), nullable=True)  # SAM.gov Unique Entity Identifier
    naics_codes = Column(JSON, default=list, nullable=False)  # List of NAICS codes
    set_asides = Column(JSON, default=list, nullable=True)  # 8(a), WOSB, SDVOSB, HUBZone, Small Business
    capabilities = Column(Text, nullable=True)  # 500 word capability statement
    contract_value_min = Column(DECIMAL(15, 2), nullable=True)
    contract_value_max = Column(DECIMAL(15, 2), nullable=True)
    geographic_preferences = Column(JSON, default=list, nullable=True)  # States or "Nationwide"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="company")

    def __repr__(self):
        return f"<Company {self.name}>"
