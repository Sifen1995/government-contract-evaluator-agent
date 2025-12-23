# User Story: Secure Document Upload & Management

## Overview

**Feature**: Business Registration & Secure Document Upload
**Requirement Reference**: Requirement #3 from AI_Procurement_Platform_Updated_Requirements.docx.md
**Status**: ✅ IMPLEMENTED (2024-12-23)
**Priority**: HIGH
**Estimated Effort**: 2-3 weeks

> **Implementation Notes:**
> - Database migration: `005_add_document_management.py`
> - Models: `app/models/document.py`
> - Service: `app/services/document.py`, `app/services/s3.py`
> - API: `app/api/v1/documents.py`
> - Schemas: `app/schemas/document.py`

---

## Business Value

### Current State
- Business profiles only support a 500-word text-based capability statement
- No file upload capability exists
- Certifications are stored as text labels (e.g., "8(a)", "WOSB") without proof documents
- No past performance documentation storage
- AI cannot analyze actual company documents

### Target State
- Businesses can upload actual capability statement PDFs
- Certification documents can be stored with expiration tracking
- Past performance records can be uploaded and verified
- AI can extract and analyze document contents
- Documents are securely stored with versioning and access control

### ROI Impact
- **Improved AI Accuracy**: AI can analyze actual capabilities, not just user-entered text
- **Compliance**: Enables verification of certifications
- **Competitive Advantage**: Matches GovRat and other competitors' features
- **User Trust**: Professional document management builds confidence

---

## User Stories

### US-DOC-1: Upload Capability Statement

**As a** small business owner
**I want to** upload my company's capability statement PDF
**So that** the AI can analyze my actual capabilities and match me to relevant opportunities

**Acceptance Criteria:**
- [ ] User can upload PDF files up to 10MB
- [ ] System validates file type (PDF, DOCX, DOC only)
- [ ] Upload progress indicator shown
- [ ] Success confirmation with document preview
- [ ] Document stored securely with encryption at rest
- [ ] Previous version retained when uploading new version
- [ ] AI extraction triggered automatically after upload

**Technical Notes:**
- Use AWS S3 with pre-signed URLs for direct upload
- Store metadata in PostgreSQL documents table
- Trigger async processing via Celery task

---

### US-DOC-2: Upload Certification Documents

**As a** certified small business (8(a), WOSB, SDVOSB, HUBZone)
**I want to** upload my certification documents with expiration dates
**So that** I can prove my certification status and receive alerts before expiration

**Acceptance Criteria:**
- [ ] User can upload certification proof documents
- [ ] User can set certification type (8(a), WOSB, SDVOSB, HUBZone, etc.)
- [ ] User can set expiration date
- [ ] System sends reminder 90, 60, 30 days before expiration
- [ ] Expired certifications are flagged in profile
- [ ] AI considers certification validity in scoring

**Data Model:**
```python
class CertificationDocument(Base):
    id = Column(UUID, primary_key=True)
    company_id = Column(UUID, ForeignKey("companies.id"))
    certification_type = Column(String(50))  # 8(a), WOSB, etc.
    document_url = Column(String(500))
    issued_date = Column(Date)
    expiration_date = Column(Date)
    status = Column(String(20))  # active, expired, pending_renewal
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

---

### US-DOC-3: Upload Past Performance Documents

**As a** government contractor with past performance history
**I want to** upload my past performance records and CPARS reports
**So that** the AI can accurately assess my experience and win probability

**Acceptance Criteria:**
- [ ] User can upload past performance documents (CPARS, references)
- [ ] User can tag documents with contract details (agency, value, period)
- [ ] User can add NAICS codes performed under each contract
- [ ] AI extracts key performance metrics from documents
- [ ] Past performance considered in opportunity scoring

**Data Model:**
```python
class PastPerformanceDocument(Base):
    id = Column(UUID, primary_key=True)
    company_id = Column(UUID, ForeignKey("companies.id"))
    document_url = Column(String(500))
    contract_number = Column(String(100))
    agency_name = Column(String(255))
    contract_value = Column(Numeric)
    period_of_performance_start = Column(Date)
    period_of_performance_end = Column(Date)
    naics_codes = Column(ARRAY(String))
    performance_rating = Column(String(50))  # Exceptional, Very Good, etc.
    ai_extracted_data = Column(JSONB)
    created_at = Column(DateTime)
```

---

### US-DOC-4: Document Versioning

**As a** business user updating my documents
**I want to** keep previous versions of uploaded documents
**So that** I can track changes and revert if needed

**Acceptance Criteria:**
- [ ] Each upload creates a new version, not overwrite
- [ ] Version history visible in UI
- [ ] User can view/download any previous version
- [ ] User can restore a previous version as current
- [ ] Version metadata includes upload date, user, file size

**Data Model:**
```python
class DocumentVersion(Base):
    id = Column(UUID, primary_key=True)
    document_id = Column(UUID, ForeignKey("documents.id"))
    version_number = Column(Integer)
    file_url = Column(String(500))
    file_size = Column(BigInteger)
    uploaded_by = Column(UUID, ForeignKey("users.id"))
    uploaded_at = Column(DateTime)
    is_current = Column(Boolean, default=True)
    checksum = Column(String(64))  # SHA-256
```

---

### US-DOC-5: AI Document Extraction

**As a** platform system
**I want to** automatically extract text and metadata from uploaded documents
**So that** the AI can analyze document contents for better matching

**Acceptance Criteria:**
- [ ] PDF text extraction via PyPDF2 or AWS Textract
- [ ] DOCX text extraction via python-docx
- [ ] Extracted text stored in searchable format
- [ ] Key entities extracted (NAICS codes, agencies, values)
- [ ] Extraction status visible to user
- [ ] Extraction errors handled gracefully

**Technical Implementation:**
```python
async def extract_document_content(document_id: UUID):
    """
    Extract text and metadata from uploaded document
    """
    document = get_document(document_id)

    if document.file_type == "pdf":
        text = extract_pdf_text(document.file_url)
    elif document.file_type in ["docx", "doc"]:
        text = extract_docx_text(document.file_url)

    # Extract entities using GPT-4
    entities = await extract_entities_with_ai(text)

    # Store extracted data
    document.extracted_text = text
    document.extracted_entities = entities
    document.extraction_status = "completed"

    return document
```

---

### US-DOC-6: Access Control

**As a** security-conscious business owner
**I want to** control who can access my uploaded documents
**So that** sensitive business information is protected

**Acceptance Criteria:**
- [ ] Documents are private to company by default
- [ ] Only company users can view/download
- [ ] Pre-signed URLs expire after 15 minutes
- [ ] Access logged for audit trail
- [ ] Admin cannot access documents without explicit permission

---

## API Endpoints

```
POST   /api/v1/documents/upload          - Get pre-signed upload URL
POST   /api/v1/documents/                - Create document record after upload
GET    /api/v1/documents/                - List company documents
GET    /api/v1/documents/{id}            - Get document details
GET    /api/v1/documents/{id}/download   - Get pre-signed download URL
DELETE /api/v1/documents/{id}            - Soft delete document
GET    /api/v1/documents/{id}/versions   - List document versions
POST   /api/v1/documents/{id}/versions/{version}/restore - Restore version

POST   /api/v1/certifications/           - Create certification with document
GET    /api/v1/certifications/           - List certifications
PUT    /api/v1/certifications/{id}       - Update certification
DELETE /api/v1/certifications/{id}       - Delete certification

POST   /api/v1/past-performance/         - Create past performance record
GET    /api/v1/past-performance/         - List past performance
PUT    /api/v1/past-performance/{id}     - Update record
DELETE /api/v1/past-performance/{id}     - Delete record
```

---

## UI Wireframes

### Settings Page - Documents Tab

```
+----------------------------------------------------------+
|  Company Settings                                          |
+----------------------------------------------------------+
|  [Profile] [Documents] [Certifications] [Past Performance] |
+----------------------------------------------------------+
|                                                            |
|  Capability Statement                                      |
|  +------------------------------------------------------+  |
|  | capability_statement_v3.pdf          Uploaded 12/15   |  |
|  | [View] [Download] [Replace] [Version History]         |  |
|  +------------------------------------------------------+  |
|                                                            |
|  [+ Upload New Document]                                   |
|                                                            |
|  Other Documents                                           |
|  +------------------------------------------------------+  |
|  | company_brochure.pdf                 Uploaded 12/10   |  |
|  | [View] [Download] [Delete]                            |  |
|  +------------------------------------------------------+  |
|                                                            |
+----------------------------------------------------------+
```

### Certifications Tab

```
+----------------------------------------------------------+
|  Certifications                                            |
+----------------------------------------------------------+
|                                                            |
|  +------------------------------------------------------+  |
|  | 8(a) Business Development Program                     |  |
|  | Status: ACTIVE                   Expires: 2025-06-15  |  |
|  | Document: 8a_certification.pdf                        |  |
|  | [View Certificate] [Update] [Remove]                  |  |
|  +------------------------------------------------------+  |
|                                                            |
|  +------------------------------------------------------+  |
|  | WOSB (Women-Owned Small Business)                     |  |
|  | Status: EXPIRING SOON            Expires: 2024-01-30  |  |
|  | Document: wosb_cert.pdf                               |  |
|  | [View Certificate] [Renew] [Remove]                   |  |
|  +------------------------------------------------------+  |
|                                                            |
|  [+ Add Certification]                                     |
|                                                            |
+----------------------------------------------------------+
```

---

## Database Migrations

```sql
-- Migration: Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,  -- capability_statement, certification, past_performance, other
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,  -- pdf, docx, doc
    file_size BIGINT NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    extracted_text TEXT,
    extracted_entities JSONB,
    extraction_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Migration: Create document_versions table
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_doc_versions_document ON document_versions(document_id);

-- Migration: Create certification_documents table
CREATE TABLE certification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    certification_type VARCHAR(50) NOT NULL,
    document_id UUID REFERENCES documents(id),
    issued_date DATE,
    expiration_date DATE,
    status VARCHAR(20) DEFAULT 'active',  -- active, expired, pending_renewal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cert_docs_company ON certification_documents(company_id);
CREATE INDEX idx_cert_docs_expiration ON certification_documents(expiration_date);

-- Migration: Create past_performance table
CREATE TABLE past_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id),
    contract_number VARCHAR(100),
    agency_name VARCHAR(255),
    contract_value NUMERIC(15,2),
    pop_start DATE,
    pop_end DATE,
    naics_codes TEXT[],
    performance_rating VARCHAR(50),
    description TEXT,
    ai_extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_past_perf_company ON past_performance(company_id);
CREATE INDEX idx_past_perf_naics ON past_performance USING GIN(naics_codes);
```

---

## Testing Requirements

### E2E Test Cases to Add

| Test ID | Scenario | Steps |
|---------|----------|-------|
| TC-DOC-1 | Upload capability statement PDF | Navigate to settings → Documents → Upload PDF → Verify success |
| TC-DOC-2 | Upload invalid file type | Try uploading .exe → Verify rejection |
| TC-DOC-3 | Upload file > 10MB | Try uploading large file → Verify rejection |
| TC-DOC-4 | View uploaded document | Click View → Verify PDF opens in new tab |
| TC-DOC-5 | Download document | Click Download → Verify file downloads |
| TC-DOC-6 | Replace document (versioning) | Upload new version → Verify old version in history |
| TC-DOC-7 | Restore previous version | Click Restore on old version → Verify current updates |
| TC-DOC-8 | Add certification with document | Upload cert doc → Set type/expiration → Verify saved |
| TC-DOC-9 | Certification expiration alert | Set cert to expire in 30 days → Verify warning shown |
| TC-DOC-10 | AI extraction status | Upload doc → Wait → Verify extraction completed |
| TC-DOC-11 | Access control | Try accessing another company's doc → Verify 403 |
| TC-DOC-12 | Pre-signed URL expiration | Wait 15 min → Try old URL → Verify expired |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Document upload success rate | > 99% |
| AI extraction success rate | > 95% |
| Average upload time | < 5 seconds |
| Average extraction time | < 30 seconds |
| User adoption (% with docs) | > 60% within 30 days |

---

## Dependencies

- AWS S3 bucket configured
- IAM credentials with S3 access
- Celery worker for async processing
- PyPDF2 or AWS Textract for PDF extraction
- python-docx for DOCX extraction
- ClamAV or similar for virus scanning (optional but recommended)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large file uploads fail | HIGH | Use S3 multipart upload, chunked frontend upload |
| Malicious file upload | HIGH | File type validation, virus scanning, sandboxed processing |
| S3 costs | MEDIUM | Implement lifecycle policies, compress files |
| AI extraction failures | MEDIUM | Graceful fallback, manual text entry option |
| GDPR/data privacy | HIGH | Encryption at rest, audit logging, data retention policies |
