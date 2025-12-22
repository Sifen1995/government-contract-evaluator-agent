# backend/app/models/award.py

from sqlalchemy import (
    Column, String, DateTime, Numeric,
    Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
from app.core.database import Base


class Award(Base):
    __tablename__ = "awards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    source = Column(String(50), default="usaspending")
    source_id = Column(String(255), index=True)

    awarding_agency = Column(String(255), nullable=True, index=True)
    funding_agency = Column(String(255), nullable=True)

    vendor = Column(String(255), nullable=True)
    vendor_uei = Column(String(50), nullable=True, index=True)
    vendor_duns = Column(String(50), nullable=True)

    naics = Column(String(6), nullable=True, index=True)
    psc_code = Column(String(10), nullable=True)

    amount = Column(Numeric, nullable=True)
    base_amount = Column(Numeric, nullable=True)
    potential_amount = Column(Numeric, nullable=True)

    award_type = Column(String(50), nullable=True)
    award_date = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    raw_data = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_award_naics", "naics"),
        Index("idx_award_vendor", "vendor_uei"),
    )

    def __repr__(self):
        return f"<Award {self.source_id} {self.vendor}>"
