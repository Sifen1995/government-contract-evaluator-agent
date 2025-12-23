"""
Document Management Schemas

Pydantic schemas for document upload, management, certifications,
and past performance records.

Reference: TICKET-004, TICKET-005 from IMPLEMENTATION_TICKETS.md
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date
from uuid import UUID
from enum import Enum


class DocumentType(str, Enum):
    """Types of documents that can be uploaded."""
    CAPABILITY_STATEMENT = "capability_statement"
    CERTIFICATION = "certification"
    PAST_PERFORMANCE = "past_performance"
    OTHER = "other"


class ExtractionStatus(str, Enum):
    """Status of document text extraction."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CertificationStatus(str, Enum):
    """Status of a certification."""
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING_RENEWAL = "pending_renewal"


class CertificationType(str, Enum):
    """Types of certifications."""
    EIGHT_A = "8(a)"
    WOSB = "WOSB"
    SDVOSB = "SDVOSB"
    HUBZONE = "HUBZone"
    SMALL_BUSINESS = "Small Business"
    OTHER = "other"


class PerformanceRating(str, Enum):
    """CPARS performance ratings."""
    EXCEPTIONAL = "Exceptional"
    VERY_GOOD = "Very Good"
    SATISFACTORY = "Satisfactory"
    MARGINAL = "Marginal"
    UNSATISFACTORY = "Unsatisfactory"


# ============== Upload Request/Response ==============

class UploadUrlRequest(BaseModel):
    """Request to get a pre-signed upload URL."""
    file_name: str = Field(..., min_length=1, max_length=255, description="Name of the file to upload")
    content_type: str = Field(..., description="MIME type of the file")
    file_size: int = Field(..., gt=0, le=10*1024*1024, description="File size in bytes (max 10MB)")
    document_type: DocumentType = Field(..., description="Type of document")

    @field_validator('content_type')
    @classmethod
    def validate_content_type(cls, v):
        allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
        if v not in allowed:
            raise ValueError(f'Content type must be one of: {allowed}')
        return v


class UploadUrlResponse(BaseModel):
    """Response with pre-signed upload URL and document metadata."""
    upload_url: str = Field(..., description="Pre-signed URL for upload")
    upload_fields: dict = Field(..., description="Fields to include in the upload form")
    s3_key: str = Field(..., description="S3 key where file will be stored")
    s3_bucket: str = Field(..., description="S3 bucket name")
    expires_in: int = Field(..., description="Seconds until URL expires")


# ============== Document Schemas ==============

class DocumentBase(BaseModel):
    """Base document schema with common fields."""
    document_type: DocumentType
    file_name: str
    file_type: str


class DocumentCreate(BaseModel):
    """Schema for creating a document record after S3 upload."""
    document_type: DocumentType
    file_name: str = Field(..., min_length=1, max_length=255)
    file_type: str = Field(..., min_length=1, max_length=20)
    file_size: int = Field(..., gt=0)
    s3_bucket: str
    s3_key: str


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""
    file_name: Optional[str] = Field(None, min_length=1, max_length=255)


class DocumentVersionResponse(BaseModel):
    """Response schema for a document version."""
    id: UUID
    version_number: int
    file_size: int
    checksum: str
    uploaded_by: Optional[UUID] = None
    uploaded_at: datetime
    is_current: bool

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    """Response schema for a document."""
    id: UUID
    company_id: UUID
    document_type: DocumentType
    file_name: str
    file_type: str
    file_size: int
    extraction_status: ExtractionStatus
    extracted_entities: Optional[dict] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    """Detailed document response with versions."""
    versions: List[DocumentVersionResponse] = []
    download_url: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response for listing documents."""
    documents: List[DocumentResponse]
    total: int


# ============== Certification Schemas ==============

class CertificationBase(BaseModel):
    """Base certification schema."""
    certification_type: str = Field(..., description="Type of certification (8(a), WOSB, etc.)")
    issued_date: Optional[date] = None
    expiration_date: Optional[date] = None


class CertificationCreate(CertificationBase):
    """Schema for creating a certification."""
    document_id: Optional[UUID] = Field(None, description="ID of uploaded certification document")


class CertificationUpdate(BaseModel):
    """Schema for updating a certification."""
    certification_type: Optional[str] = None
    issued_date: Optional[date] = None
    expiration_date: Optional[date] = None
    document_id: Optional[UUID] = None


class CertificationResponse(CertificationBase):
    """Response schema for a certification."""
    id: UUID
    company_id: UUID
    document_id: Optional[UUID] = None
    status: CertificationStatus
    is_expiring_soon: bool = False
    days_until_expiration: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificationListResponse(BaseModel):
    """Response for listing certifications."""
    certifications: List[CertificationResponse]
    total: int


# ============== Past Performance Schemas ==============

class PastPerformanceBase(BaseModel):
    """Base past performance schema."""
    contract_number: Optional[str] = Field(None, max_length=100)
    agency_name: Optional[str] = Field(None, max_length=255)
    contract_value: Optional[float] = None
    pop_start: Optional[date] = None
    pop_end: Optional[date] = None
    naics_codes: Optional[List[str]] = None
    performance_rating: Optional[str] = None
    description: Optional[str] = None


class PastPerformanceCreate(PastPerformanceBase):
    """Schema for creating a past performance record."""
    document_id: Optional[UUID] = Field(None, description="ID of uploaded performance document")


class PastPerformanceUpdate(PastPerformanceBase):
    """Schema for updating a past performance record."""
    document_id: Optional[UUID] = None


class PastPerformanceResponse(PastPerformanceBase):
    """Response schema for a past performance record."""
    id: UUID
    company_id: UUID
    document_id: Optional[UUID] = None
    ai_extracted_data: Optional[dict] = None
    duration_months: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PastPerformanceListResponse(BaseModel):
    """Response for listing past performance records."""
    records: List[PastPerformanceResponse]
    total: int
