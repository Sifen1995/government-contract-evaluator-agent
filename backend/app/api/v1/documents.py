"""
Document Management API Routes

Endpoints for document upload, management, certifications,
and past performance records.

Reference: TICKET-004, TICKET-005, TICKET-007, TICKET-008 from IMPLEMENTATION_TICKETS.md
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services import company as company_service
from app.services.document import document_service, certification_service, past_performance_service
from app.schemas.document import (
    UploadUrlRequest,
    UploadUrlResponse,
    DocumentCreate,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentVersionResponse,
    CertificationCreate,
    CertificationUpdate,
    CertificationResponse,
    CertificationListResponse,
    PastPerformanceCreate,
    PastPerformanceUpdate,
    PastPerformanceResponse,
    PastPerformanceListResponse,
    DocumentSuggestionsResponse,
    ApplySuggestionsRequest,
    ApplySuggestionsResponse,
    SuggestedNAICS,
    SuggestedCertification,
    ExtractionStatus,
)
from app.schemas.auth import MessageResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_company_id(current_user: User, db: Session) -> UUID:
    """Helper to get user's company ID or raise 404."""
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Please complete onboarding first."
        )
    return company.id


# ============== Document Upload ==============

@router.post("/upload", response_model=UploadUrlResponse)
def get_upload_url(
    request: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a pre-signed URL for uploading a document to S3.

    - Returns URL valid for 15 minutes
    - Use the returned fields in a multipart form POST to the URL
    - After successful upload, call POST /documents/ to create the record
    """
    company_id = get_user_company_id(current_user, db)

    try:
        result = document_service.get_upload_url(
            company_id=company_id,
            document_type=request.document_type.value,
            file_name=request.file_name,
            content_type=request.content_type,
            file_size=request.file_size
        )
        return UploadUrlResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============== Document CRUD ==============

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    document_data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a document record after successful S3 upload.

    - Call this after uploading to the pre-signed URL
    - Triggers async text extraction
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.create_document(
        db=db,
        company_id=company_id,
        document_type=document_data.document_type.value,
        file_name=document_data.file_name,
        file_type=document_data.file_type,
        file_size=document_data.file_size,
        s3_bucket=document_data.s3_bucket,
        s3_key=document_data.s3_key,
        user_id=current_user.id
    )

    # TODO: Trigger async text extraction task
    # extract_document_text.delay(document.id)

    return document


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all documents for the current user's company.

    - Can filter by document_type
    - Supports pagination
    """
    company_id = get_user_company_id(current_user, db)

    documents, total = document_service.list_documents(
        db=db,
        company_id=company_id,
        document_type=document_type,
        skip=skip,
        limit=limit
    )

    return DocumentListResponse(documents=documents, total=total)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a document by ID with version history.

    - Includes download URL
    - Includes all versions
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Get download URL
    download_url = document_service.get_download_url(document)

    # Get versions
    versions = document_service.get_document_versions(db, document_id)

    return DocumentDetailResponse(
        **{k: v for k, v in document.__dict__.items() if not k.startswith('_')},
        versions=[DocumentVersionResponse.model_validate(v) for v in versions],
        download_url=download_url
    )


@router.get("/{document_id}/download")
def get_download_url(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a pre-signed download URL for a document.

    - URL valid for 15 minutes
    - Returns redirect-ready URL
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    url = document_service.get_download_url(document)
    return {"download_url": url}


@router.delete("/{document_id}", response_model=MessageResponse)
def delete_document(
    document_id: UUID,
    hard_delete: bool = Query(False, description="Permanently delete from S3"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document (soft delete by default).

    - Soft delete marks as deleted but keeps in S3
    - Hard delete removes from S3 as well
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document_service.delete_document(db, document, hard_delete=hard_delete)
    return MessageResponse(message="Document deleted successfully")


# ============== Document Versions ==============

@router.get("/{document_id}/versions", response_model=list[DocumentVersionResponse])
def list_document_versions(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all versions of a document.

    - Returns versions in descending order (newest first)
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    versions = document_service.get_document_versions(db, document_id)
    return [DocumentVersionResponse.model_validate(v) for v in versions]


@router.post("/{document_id}/versions/{version_number}/restore", response_model=DocumentResponse)
def restore_document_version(
    document_id: UUID,
    version_number: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore a previous version of a document as the current version.
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    restored = document_service.restore_version(db, document, version_number)
    if not restored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_number} not found"
        )

    return restored


# ============== Document Suggestions ==============

@router.get("/{document_id}/suggestions", response_model=DocumentSuggestionsResponse)
def get_document_suggestions(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get extracted suggestions from a document for company profile auto-population.

    - Returns NAICS codes, certifications, capabilities extracted from document
    - Includes OCR quality indicator for scanned documents
    - Returns empty lists if extraction not completed
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Get OCR quality label
    ocr_quality = None
    if document.ocr_confidence is not None:
        from app.services.ocr import get_ocr_quality_label
        ocr_quality = get_ocr_quality_label(float(document.ocr_confidence))

    # Parse extracted entities into suggestions
    entities = document.extracted_entities or {}

    # Parse NAICS codes
    naics_suggestions = []
    for code in entities.get('naics_codes', []):
        if isinstance(code, str):
            naics_suggestions.append(SuggestedNAICS(code=code))
        elif isinstance(code, dict):
            naics_suggestions.append(SuggestedNAICS(**code))

    # Parse certifications
    cert_suggestions = []
    for cert in entities.get('certifications', []):
        if isinstance(cert, str):
            cert_suggestions.append(SuggestedCertification(certification_type=cert))
        elif isinstance(cert, dict):
            cert_suggestions.append(SuggestedCertification(**cert))

    # Get capabilities from key_capabilities
    capabilities_text = None
    key_capabilities = entities.get('key_capabilities', [])
    if key_capabilities:
        capabilities_text = '. '.join(key_capabilities) if isinstance(key_capabilities, list) else str(key_capabilities)

    return DocumentSuggestionsResponse(
        document_id=document.id,
        extraction_status=ExtractionStatus(document.extraction_status),
        ocr_confidence=float(document.ocr_confidence) if document.ocr_confidence else None,
        ocr_quality=ocr_quality,
        is_scanned=document.is_scanned,
        suggestions_reviewed=document.suggestions_reviewed,
        naics_codes=naics_suggestions,
        certifications=cert_suggestions,
        capabilities=capabilities_text,
        agencies=entities.get('agencies', []),
        locations=entities.get('locations', []),
        contract_values=entities.get('contract_values', []),
        raw_entities=entities
    )


@router.post("/{document_id}/apply-suggestions", response_model=ApplySuggestionsResponse)
def apply_document_suggestions(
    document_id: UUID,
    request: ApplySuggestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply selected suggestions from a document to the company profile.

    - Adds selected NAICS codes to company profile
    - Creates certification records for selected certifications
    - Updates or appends to company capabilities statement
    - Updates company profile version (triggers re-scoring)
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    if document.extraction_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document extraction not completed yet"
        )

    # Get company
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    naics_added = 0
    certs_created = 0
    capabilities_updated = False
    geo_added = 0

    # Add NAICS codes
    if request.naics_codes:
        existing_naics = set(company.naics_codes or [])
        new_naics = [code for code in request.naics_codes if code not in existing_naics]
        if new_naics:
            updated_naics = list(existing_naics) + new_naics
            company.naics_codes = updated_naics[:10]  # Max 10 codes
            naics_added = len(new_naics)

    # Create certifications
    if request.certifications:
        for cert_type in request.certifications:
            # Check if certification already exists
            existing = certification_service.get_certification_by_type(db, company_id, cert_type)
            if not existing:
                certification_service.create_certification(
                    db=db,
                    company_id=company_id,
                    certification_type=cert_type,
                    document_id=document_id
                )
                certs_created += 1

    # Update capabilities
    if request.capabilities:
        if request.append_capabilities and company.capabilities:
            company.capabilities = f"{company.capabilities}\n\n{request.capabilities}"
        else:
            company.capabilities = request.capabilities
        capabilities_updated = True

    # Add geographic preferences
    if request.geographic_preferences:
        existing_geo = set(company.geographic_preferences or [])
        new_geo = [state for state in request.geographic_preferences if state not in existing_geo]
        if new_geo:
            updated_geo = list(existing_geo) + new_geo
            company.geographic_preferences = updated_geo
            geo_added = len(new_geo)

    # Increment profile version if changes were made
    if naics_added > 0 or certs_created > 0 or capabilities_updated or geo_added > 0:
        company.profile_version = (company.profile_version or 0) + 1

    # Mark suggestions as reviewed
    document.suggestions_reviewed = True

    db.commit()

    return ApplySuggestionsResponse(
        naics_codes_added=naics_added,
        certifications_created=certs_created,
        capabilities_updated=capabilities_updated,
        geographic_preferences_added=geo_added,
        profile_version=company.profile_version or 1,
        message=f"Applied suggestions: {naics_added} NAICS codes, {certs_created} certifications, {geo_added} locations"
    )


@router.post("/{document_id}/mark-reviewed", response_model=MessageResponse)
def mark_suggestions_reviewed(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark document suggestions as reviewed without applying them.
    """
    company_id = get_user_company_id(current_user, db)

    document = document_service.get_document(db, document_id, company_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    document.suggestions_reviewed = True
    db.commit()

    return MessageResponse(message="Suggestions marked as reviewed")


# ============== Certifications ==============

@router.post("/certifications/", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def create_certification(
    cert_data: CertificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a certification record.

    - Can optionally link to an uploaded document
    - Status auto-calculated based on expiration date
    """
    company_id = get_user_company_id(current_user, db)

    cert = certification_service.create_certification(
        db=db,
        company_id=company_id,
        certification_type=cert_data.certification_type,
        document_id=cert_data.document_id,
        issued_date=cert_data.issued_date,
        expiration_date=cert_data.expiration_date
    )

    return _enrich_certification_response(cert)


@router.get("/certifications/", response_model=CertificationListResponse)
def list_certifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all certifications for the current user's company.

    - Ordered by expiration date (soonest first)
    """
    company_id = get_user_company_id(current_user, db)

    certs, total = certification_service.list_certifications(
        db=db,
        company_id=company_id,
        skip=skip,
        limit=limit
    )

    return CertificationListResponse(
        certifications=[_enrich_certification_response(c) for c in certs],
        total=total
    )


@router.get("/certifications/{cert_id}", response_model=CertificationResponse)
def get_certification(
    cert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a certification by ID."""
    company_id = get_user_company_id(current_user, db)

    cert = certification_service.get_certification(db, cert_id, company_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )

    return _enrich_certification_response(cert)


@router.put("/certifications/{cert_id}", response_model=CertificationResponse)
def update_certification(
    cert_id: UUID,
    cert_data: CertificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a certification."""
    company_id = get_user_company_id(current_user, db)

    cert = certification_service.get_certification(db, cert_id, company_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )

    updated = certification_service.update_certification(
        db=db,
        cert=cert,
        **cert_data.model_dump(exclude_unset=True)
    )

    return _enrich_certification_response(updated)


@router.delete("/certifications/{cert_id}", response_model=MessageResponse)
def delete_certification(
    cert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a certification."""
    company_id = get_user_company_id(current_user, db)

    cert = certification_service.get_certification(db, cert_id, company_id)
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found"
        )

    certification_service.delete_certification(db, cert)
    return MessageResponse(message="Certification deleted successfully")


def _enrich_certification_response(cert) -> CertificationResponse:
    """Add computed fields to certification response."""
    days_until = None
    is_expiring_soon = False

    if cert.expiration_date:
        days_until = (cert.expiration_date - date.today()).days
        is_expiring_soon = 0 < days_until <= 90

    return CertificationResponse(
        id=cert.id,
        company_id=cert.company_id,
        certification_type=cert.certification_type,
        document_id=cert.document_id,
        issued_date=cert.issued_date,
        expiration_date=cert.expiration_date,
        status=cert.status,
        is_expiring_soon=is_expiring_soon,
        days_until_expiration=days_until if days_until and days_until >= 0 else None,
        created_at=cert.created_at,
        updated_at=cert.updated_at
    )


# ============== Past Performance ==============

@router.post("/past-performance/", response_model=PastPerformanceResponse, status_code=status.HTTP_201_CREATED)
def create_past_performance(
    record_data: PastPerformanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a past performance record.

    - Can optionally link to an uploaded document
    """
    company_id = get_user_company_id(current_user, db)

    record = past_performance_service.create_record(
        db=db,
        company_id=company_id,
        **record_data.model_dump(exclude_unset=True)
    )

    return _enrich_past_performance_response(record)


@router.get("/past-performance/", response_model=PastPerformanceListResponse)
def list_past_performance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all past performance records for the current user's company.

    - Ordered by period of performance end date (newest first)
    """
    company_id = get_user_company_id(current_user, db)

    records, total = past_performance_service.list_records(
        db=db,
        company_id=company_id,
        skip=skip,
        limit=limit
    )

    return PastPerformanceListResponse(
        records=[_enrich_past_performance_response(r) for r in records],
        total=total
    )


@router.get("/past-performance/{record_id}", response_model=PastPerformanceResponse)
def get_past_performance(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a past performance record by ID."""
    company_id = get_user_company_id(current_user, db)

    record = past_performance_service.get_record(db, record_id, company_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Past performance record not found"
        )

    return _enrich_past_performance_response(record)


@router.put("/past-performance/{record_id}", response_model=PastPerformanceResponse)
def update_past_performance(
    record_id: UUID,
    record_data: PastPerformanceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a past performance record."""
    company_id = get_user_company_id(current_user, db)

    record = past_performance_service.get_record(db, record_id, company_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Past performance record not found"
        )

    updated = past_performance_service.update_record(
        db=db,
        record=record,
        **record_data.model_dump(exclude_unset=True)
    )

    return _enrich_past_performance_response(updated)


@router.delete("/past-performance/{record_id}", response_model=MessageResponse)
def delete_past_performance(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a past performance record."""
    company_id = get_user_company_id(current_user, db)

    record = past_performance_service.get_record(db, record_id, company_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Past performance record not found"
        )

    past_performance_service.delete_record(db, record)
    return MessageResponse(message="Past performance record deleted successfully")


def _enrich_past_performance_response(record) -> PastPerformanceResponse:
    """Add computed fields to past performance response."""
    duration_months = None
    if record.pop_start and record.pop_end:
        delta = record.pop_end - record.pop_start
        duration_months = delta.days // 30

    return PastPerformanceResponse(
        id=record.id,
        company_id=record.company_id,
        document_id=record.document_id,
        contract_number=record.contract_number,
        agency_name=record.agency_name,
        contract_value=float(record.contract_value) if record.contract_value else None,
        pop_start=record.pop_start,
        pop_end=record.pop_end,
        naics_codes=record.naics_codes,
        performance_rating=record.performance_rating,
        description=record.description,
        ai_extracted_data=record.ai_extracted_data,
        duration_months=duration_months,
        created_at=record.created_at,
        updated_at=record.updated_at
    )
