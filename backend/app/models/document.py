"""
Document Management Models

Models for secure document upload and management:
- Document: Core document metadata and storage info
- DocumentVersion: Version tracking for documents
- CertificationDocument: Certification tracking with expiration
- PastPerformance: Past performance records

Reference: TICKET-003 from IMPLEMENTATION_TICKETS.md
"""
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, BigInteger, Date, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
from app.core.database import Base


class Document(Base):
    """
    Core document storage metadata.
    Stores information about uploaded files and their extraction status.
    """
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    # Document type: capability_statement, certification, past_performance, other
    document_type = Column(String(50), nullable=False)

    # File metadata
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # pdf, docx, doc
    file_size = Column(BigInteger, nullable=False)

    # S3 storage
    s3_bucket = Column(String(100), nullable=False)
    s3_key = Column(String(500), nullable=False)

    # AI extraction
    extracted_text = Column(Text, nullable=True)
    extracted_entities = Column(JSONB, nullable=True)
    extraction_status = Column(String(20), default="pending", nullable=False)  # pending, processing, completed, failed

    # OCR metadata
    ocr_confidence = Column(Numeric(5, 2), nullable=True)  # 0-100 confidence score
    is_scanned = Column(Boolean, default=False, nullable=False)  # True if OCR was needed

    # Suggestion tracking for profile auto-population
    suggestions_reviewed = Column(Boolean, default=False, nullable=False)  # True after user reviews suggestions

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    certification_documents = relationship("CertificationDocument", back_populates="document")
    past_performance_records = relationship("PastPerformance", back_populates="document")

    def __repr__(self):
        return f"<Document {self.file_name} ({self.document_type})>"

    @property
    def current_version(self):
        """Get the current version of this document."""
        for version in self.versions:
            if version.is_current:
                return version
        return None


class DocumentVersion(Base):
    """
    Version tracking for documents.
    Each upload creates a new version, allowing version history and rollback.
    """
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    # Version info
    version_number = Column(Integer, nullable=False)
    s3_key = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    checksum = Column(String(64), nullable=False)  # SHA-256

    # Upload tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    is_current = Column(Boolean, default=True, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="versions")
    uploader = relationship("User")

    def __repr__(self):
        return f"<DocumentVersion {self.document_id} v{self.version_number}>"


class CertificationDocument(Base):
    """
    Certification tracking with expiration dates.
    Links certifications to proof documents and tracks validity.
    """
    __tablename__ = "certification_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    # Certification info
    certification_type = Column(String(50), nullable=False)  # 8(a), WOSB, SDVOSB, HUBZone, etc.
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Validity dates
    issued_date = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)

    # Status: active, expired, pending_renewal
    status = Column(String(20), default="active", nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="certification_documents")
    document = relationship("Document", back_populates="certification_documents")

    def __repr__(self):
        return f"<CertificationDocument {self.certification_type} ({self.status})>"

    @property
    def is_expiring_soon(self) -> bool:
        """Check if certification expires within 90 days."""
        if not self.expiration_date:
            return False
        days_until_expiration = (self.expiration_date - date.today()).days
        return 0 < days_until_expiration <= 90

    @property
    def is_expired(self) -> bool:
        """Check if certification has expired."""
        if not self.expiration_date:
            return False
        return self.expiration_date < date.today()

    def update_status(self):
        """Update status based on expiration date."""
        if self.is_expired:
            self.status = "expired"
        elif self.is_expiring_soon:
            self.status = "pending_renewal"
        else:
            self.status = "active"


class PastPerformance(Base):
    """
    Past performance records for government contracting history.
    Tracks completed contracts, agencies, and performance ratings.
    """
    __tablename__ = "past_performance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Contract details
    contract_number = Column(String(100), nullable=True)
    agency_name = Column(String(255), nullable=True)
    contract_value = Column(Numeric(15, 2), nullable=True)

    # Period of performance
    pop_start = Column(Date, nullable=True)
    pop_end = Column(Date, nullable=True)

    # Classification
    naics_codes = Column(ARRAY(Text), nullable=True)
    performance_rating = Column(String(50), nullable=True)  # Exceptional, Very Good, Satisfactory, etc.
    description = Column(Text, nullable=True)

    # AI extracted data from documents
    ai_extracted_data = Column(JSONB, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="past_performance_records")
    document = relationship("Document", back_populates="past_performance_records")

    def __repr__(self):
        return f"<PastPerformance {self.contract_number} - {self.agency_name}>"

    @property
    def duration_months(self) -> int | None:
        """Calculate the duration of the contract in months."""
        if not self.pop_start or not self.pop_end:
            return None
        delta = self.pop_end - self.pop_start
        return delta.days // 30
