"""
Document Management Service

Business logic for document upload, management, certifications,
and past performance records.

Reference: TICKET-004, TICKET-005, TICKET-007, TICKET-008 from IMPLEMENTATION_TICKETS.md
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
import logging
import hashlib

from app.models.document import Document, DocumentVersion, CertificationDocument, PastPerformance
from app.services.s3 import s3_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for managing documents."""

    def get_upload_url(
        self,
        company_id: UUID,
        document_type: str,
        file_name: str,
        content_type: str,
        file_size: int
    ) -> dict:
        """
        Generate a pre-signed URL for uploading a document.

        Args:
            company_id: Company UUID
            document_type: Type of document
            file_name: Original file name
            content_type: MIME type
            file_size: File size in bytes

        Returns:
            Dict with upload URL, fields, and S3 key
        """
        # Generate unique S3 key
        s3_key = s3_service.generate_s3_key(str(company_id), document_type, file_name)

        # Generate pre-signed URL
        presigned = s3_service.generate_presigned_upload_url(
            s3_key=s3_key,
            content_type=content_type,
            file_size=file_size,
            metadata={
                'company-id': str(company_id),
                'document-type': document_type,
                'original-filename': file_name
            }
        )

        return {
            'upload_url': presigned['url'],
            'upload_fields': presigned['fields'],
            's3_key': s3_key,
            's3_bucket': settings.S3_BUCKET_NAME,
            'expires_in': settings.S3_PRESIGNED_URL_EXPIRY
        }

    def create_document(
        self,
        db: Session,
        company_id: UUID,
        document_type: str,
        file_name: str,
        file_type: str,
        file_size: int,
        s3_bucket: str,
        s3_key: str,
        user_id: Optional[UUID] = None
    ) -> Document:
        """
        Create a document record after successful S3 upload.

        Args:
            db: Database session
            company_id: Company UUID
            document_type: Type of document
            file_name: Original file name
            file_type: File extension
            file_size: File size in bytes
            s3_bucket: S3 bucket name
            s3_key: S3 key
            user_id: Optional user who uploaded

        Returns:
            Created Document instance
        """
        # Create document record
        document = Document(
            company_id=company_id,
            document_type=document_type,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            s3_bucket=s3_bucket,
            s3_key=s3_key,
            extraction_status='pending'
        )
        db.add(document)
        db.flush()  # Get the ID

        # Create initial version
        checksum = hashlib.sha256(f"{s3_key}:{file_size}:{datetime.utcnow()}".encode()).hexdigest()
        version = DocumentVersion(
            document_id=document.id,
            version_number=1,
            s3_key=s3_key,
            file_size=file_size,
            checksum=checksum,
            uploaded_by=user_id,
            is_current=True
        )
        db.add(version)
        db.commit()
        db.refresh(document)

        logger.info(f"Created document {document.id} for company {company_id}")
        return document

    def get_document(self, db: Session, document_id: UUID, company_id: UUID) -> Optional[Document]:
        """
        Get a document by ID, ensuring it belongs to the company.

        Args:
            db: Database session
            document_id: Document UUID
            company_id: Company UUID for access control

        Returns:
            Document instance or None
        """
        return db.query(Document).filter(
            and_(
                Document.id == document_id,
                Document.company_id == company_id,
                Document.is_deleted == False
            )
        ).first()

    def list_documents(
        self,
        db: Session,
        company_id: UUID,
        document_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Document], int]:
        """
        List documents for a company.

        Args:
            db: Database session
            company_id: Company UUID
            document_type: Optional filter by type
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            Tuple of (documents list, total count)
        """
        query = db.query(Document).filter(
            and_(
                Document.company_id == company_id,
                Document.is_deleted == False
            )
        )

        if document_type:
            query = query.filter(Document.document_type == document_type)

        total = query.count()
        documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()

        return documents, total

    def get_download_url(self, document: Document) -> str:
        """
        Generate a pre-signed download URL for a document.

        Args:
            document: Document instance

        Returns:
            Pre-signed download URL
        """
        return s3_service.generate_presigned_download_url(
            s3_key=document.s3_key,
            file_name=document.file_name
        )

    def delete_document(self, db: Session, document: Document, hard_delete: bool = False) -> bool:
        """
        Delete a document (soft delete by default).

        Args:
            db: Database session
            document: Document to delete
            hard_delete: If True, actually delete from DB and S3

        Returns:
            True if successful
        """
        if hard_delete:
            # Delete from S3
            try:
                s3_service.delete_file(document.s3_key)
                # Delete all versions
                for version in document.versions:
                    if version.s3_key != document.s3_key:
                        s3_service.delete_file(version.s3_key)
            except Exception as e:
                logger.error(f"Failed to delete files from S3: {e}")

            db.delete(document)
        else:
            document.is_deleted = True

        db.commit()
        logger.info(f"Deleted document {document.id} (hard_delete={hard_delete})")
        return True

    def get_document_versions(self, db: Session, document_id: UUID) -> List[DocumentVersion]:
        """
        Get all versions of a document.

        Args:
            db: Database session
            document_id: Document UUID

        Returns:
            List of document versions
        """
        return db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).all()

    def restore_version(
        self,
        db: Session,
        document: Document,
        version_number: int
    ) -> Optional[Document]:
        """
        Restore a previous version as the current version.

        Args:
            db: Database session
            document: Document instance
            version_number: Version to restore

        Returns:
            Updated document or None if version not found
        """
        # Find the version to restore
        version = db.query(DocumentVersion).filter(
            and_(
                DocumentVersion.document_id == document.id,
                DocumentVersion.version_number == version_number
            )
        ).first()

        if not version:
            return None

        # Mark all versions as not current
        db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document.id
        ).update({DocumentVersion.is_current: False})

        # Mark the target version as current
        version.is_current = True

        # Update document with version info
        document.s3_key = version.s3_key
        document.file_size = version.file_size
        document.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(document)

        logger.info(f"Restored document {document.id} to version {version_number}")
        return document


class CertificationService:
    """Service for managing certifications."""

    def create_certification(
        self,
        db: Session,
        company_id: UUID,
        certification_type: str,
        document_id: Optional[UUID] = None,
        issued_date: Optional[date] = None,
        expiration_date: Optional[date] = None
    ) -> CertificationDocument:
        """
        Create a certification record.

        Args:
            db: Database session
            company_id: Company UUID
            certification_type: Type of certification
            document_id: Optional linked document
            issued_date: When certification was issued
            expiration_date: When certification expires

        Returns:
            Created CertificationDocument instance
        """
        status = self._calculate_status(expiration_date)

        cert = CertificationDocument(
            company_id=company_id,
            certification_type=certification_type,
            document_id=document_id,
            issued_date=issued_date,
            expiration_date=expiration_date,
            status=status
        )
        db.add(cert)
        db.commit()
        db.refresh(cert)

        logger.info(f"Created certification {cert.id} for company {company_id}")
        return cert

    def _calculate_status(self, expiration_date: Optional[date]) -> str:
        """Calculate certification status based on expiration date."""
        if not expiration_date:
            return "active"

        days_until = (expiration_date - date.today()).days

        if days_until < 0:
            return "expired"
        elif days_until <= 90:
            return "pending_renewal"
        else:
            return "active"

    def get_certification(self, db: Session, cert_id: UUID, company_id: UUID) -> Optional[CertificationDocument]:
        """Get a certification by ID."""
        return db.query(CertificationDocument).filter(
            and_(
                CertificationDocument.id == cert_id,
                CertificationDocument.company_id == company_id
            )
        ).first()

    def get_certification_by_type(self, db: Session, company_id: UUID, certification_type: str) -> Optional[CertificationDocument]:
        """Get a certification by type for a company."""
        return db.query(CertificationDocument).filter(
            and_(
                CertificationDocument.company_id == company_id,
                CertificationDocument.certification_type == certification_type
            )
        ).first()

    def list_certifications(
        self,
        db: Session,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[CertificationDocument], int]:
        """List certifications for a company."""
        query = db.query(CertificationDocument).filter(
            CertificationDocument.company_id == company_id
        )

        total = query.count()
        certs = query.order_by(CertificationDocument.expiration_date.asc().nullsfirst()).offset(skip).limit(limit).all()

        return certs, total

    def update_certification(
        self,
        db: Session,
        cert: CertificationDocument,
        **updates
    ) -> CertificationDocument:
        """Update a certification."""
        for key, value in updates.items():
            if value is not None and hasattr(cert, key):
                setattr(cert, key, value)

        # Recalculate status if expiration changed
        if 'expiration_date' in updates:
            cert.status = self._calculate_status(cert.expiration_date)

        cert.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(cert)

        return cert

    def delete_certification(self, db: Session, cert: CertificationDocument) -> bool:
        """Delete a certification."""
        db.delete(cert)
        db.commit()
        logger.info(f"Deleted certification {cert.id}")
        return True

    def get_expiring_certifications(
        self,
        db: Session,
        days_ahead: int = 90
    ) -> List[CertificationDocument]:
        """Get certifications expiring within the specified days."""
        from datetime import timedelta
        cutoff = date.today() + timedelta(days=days_ahead)

        return db.query(CertificationDocument).filter(
            and_(
                CertificationDocument.expiration_date <= cutoff,
                CertificationDocument.expiration_date >= date.today(),
                CertificationDocument.status != "expired"
            )
        ).all()


class PastPerformanceService:
    """Service for managing past performance records."""

    def create_record(
        self,
        db: Session,
        company_id: UUID,
        **data
    ) -> PastPerformance:
        """
        Create a past performance record.

        Args:
            db: Database session
            company_id: Company UUID
            **data: Record data

        Returns:
            Created PastPerformance instance
        """
        record = PastPerformance(company_id=company_id, **data)
        db.add(record)
        db.commit()
        db.refresh(record)

        logger.info(f"Created past performance record {record.id} for company {company_id}")
        return record

    def get_record(self, db: Session, record_id: UUID, company_id: UUID) -> Optional[PastPerformance]:
        """Get a past performance record by ID."""
        return db.query(PastPerformance).filter(
            and_(
                PastPerformance.id == record_id,
                PastPerformance.company_id == company_id
            )
        ).first()

    def list_records(
        self,
        db: Session,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[PastPerformance], int]:
        """List past performance records for a company."""
        query = db.query(PastPerformance).filter(
            PastPerformance.company_id == company_id
        )

        total = query.count()
        records = query.order_by(PastPerformance.pop_end.desc().nullsfirst()).offset(skip).limit(limit).all()

        return records, total

    def update_record(
        self,
        db: Session,
        record: PastPerformance,
        **updates
    ) -> PastPerformance:
        """Update a past performance record."""
        for key, value in updates.items():
            if value is not None and hasattr(record, key):
                setattr(record, key, value)

        record.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(record)

        return record

    def delete_record(self, db: Session, record: PastPerformance) -> bool:
        """Delete a past performance record."""
        db.delete(record)
        db.commit()
        logger.info(f"Deleted past performance record {record.id}")
        return True


# Global service instances
document_service = DocumentService()
certification_service = CertificationService()
past_performance_service = PastPerformanceService()
