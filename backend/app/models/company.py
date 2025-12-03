from sqlalchemy import Column, String, Text, DECIMAL, TIMESTAMP, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    legal_structure = Column(String(50))
    address_street = Column(String(255))
    address_city = Column(String(100))
    address_state = Column(String(2))
    address_zip = Column(String(10))
    uei = Column(String(12))
    naics_codes = Column(ARRAY(Text), nullable=False, default=[])
    set_asides = Column(ARRAY(Text), default=[])
    capabilities = Column(Text)
    contract_value_min = Column(DECIMAL)
    contract_value_max = Column(DECIMAL)
    geographic_preferences = Column(ARRAY(Text))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="company", cascade="all, delete-orphan")
