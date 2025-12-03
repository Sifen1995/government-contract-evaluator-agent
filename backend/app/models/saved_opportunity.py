from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="watching")
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="saved_opportunities")
    opportunity = relationship("Opportunity", back_populates="saved_by_users")

    __table_args__ = (
        UniqueConstraint('user_id', 'opportunity_id', name='uq_saved_user_opp'),
    )


class DismissedOpportunity(Base):
    __tablename__ = "dismissed_opportunities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    dismissed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="dismissed_opportunities")
    opportunity = relationship("Opportunity", back_populates="dismissed_by_users")

    __table_args__ = (
        UniqueConstraint('user_id', 'opportunity_id', name='uq_dismissed_user_opp'),
    )
