from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email_verified = Column(Boolean, default=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    email_frequency = Column(String(20), default="daily")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_login_at = Column(TIMESTAMP(timezone=True))

    # Relationships
    company = relationship("Company", back_populates="users")
    saved_opportunities = relationship("SavedOpportunity", back_populates="user", cascade="all, delete-orphan")
    dismissed_opportunities = relationship("DismissedOpportunity", back_populates="user", cascade="all, delete-orphan")
