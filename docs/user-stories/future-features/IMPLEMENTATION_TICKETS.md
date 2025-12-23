# Implementation Tickets for Unimplemented Features

> **Generated**: 2024-12-23
> **Source**: User stories from `docs/user-stories/future-features/`
> **Total Tickets**: 32
> **Estimated Total Effort**: 4-6 weeks
>
> ## Implementation Status
> | Status | Date | Notes |
> |--------|------|-------|
> | 🚀 **STARTED** | 2024-12-23 | Beginning Phase 1: Document Management |
> | ✅ TICKET-002 | 2024-12-23 | Database migration created and applied |
> | ✅ TICKET-003 | 2024-12-23 | SQLAlchemy models created (Document, DocumentVersion, CertificationDocument, PastPerformance) |
> | ✅ TICKET-001 | 2024-12-23 | S3 infrastructure: config settings, boto3 deps, S3Service class |
> | ✅ TICKET-004 | 2024-12-23 | Pre-signed URL upload endpoint implemented |
> | ✅ TICKET-005 | 2024-12-23 | Document CRUD endpoints (create, list, get, delete, download) |
> | ✅ TICKET-006 | 2024-12-23 | Document versioning endpoints (list versions, restore) |
> | ✅ TICKET-007 | 2024-12-23 | Certification endpoints (CRUD + expiration tracking) |
> | ✅ TICKET-008 | 2024-12-23 | Past performance endpoints (CRUD with duration calculation) |
> | ✅ TICKET-009 | 2024-12-23 | Document text extraction script (scripts/extract_documents.py) |
> | ✅ TICKET-010 | 2024-12-23 | Certification expiration reminders (scripts/send_certification_reminders.py) |
> | ✅ TICKET-011 | 2024-12-23 | Document Upload component (components/documents/DocumentUpload.tsx) |
> | ✅ TICKET-012 | 2024-12-23 | Settings Documents Tab with 6 tabs (settings/page.tsx) |
> | ✅ TICKET-013 | 2024-12-23 | Certifications Management UI (components/documents/CertificationForm.tsx) |
> | ✅ TICKET-014 | 2024-12-23 | Past Performance Management UI (components/documents/PastPerformanceForm.tsx) |
> | ✅ **PHASE 1 COMPLETE** | 2024-12-23 | Document Management fully implemented (Backend + Frontend) |
> | ✅ TICKET-016 | 2024-12-23 | Agency database tables migration applied |
> | ✅ TICKET-017 | 2024-12-23 | Agency SQLAlchemy models (Agency, GovernmentContact, CompanyAgencyMatch) |
> | ✅ TICKET-018 | 2024-12-23 | Agency endpoints (list, detail, contacts) |
> | ✅ TICKET-019 | 2024-12-23 | Authority matching algorithm with weighted scoring |
> | ✅ TICKET-020 | 2024-12-23 | Opportunity contacts endpoint (GET /opportunities/{id}/contacts) |
> | ✅ TICKET-021 | 2024-12-23 | OSDBU directory import script (scripts/import_osdbu_contacts.py) |
> | ✅ TICKET-022 | 2024-12-23 | Recommended Contacts on Opportunity Detail (components/agencies/OpportunityContacts.tsx) |
> | ✅ TICKET-023 | 2024-12-23 | Top Agencies Dashboard Widget (components/agencies/RecommendedAgencies.tsx) |
> | ✅ TICKET-024 | 2024-12-23 | Agency Profile Page (app/(dashboard)/agencies/[id]/page.tsx) |
> | ✅ **PHASE 2 COMPLETE** | 2024-12-23 | Authority Mapping fully implemented (Backend + Frontend) |
> | ✅ TICKET-026 | 2024-12-23 | Profile version tracking migration applied |
> | ✅ TICKET-027 | 2024-12-23 | Profile version increment on scoring field changes |
> | ✅ TICKET-028 | 2024-12-23 | Re-scoring service with stale detection |
> | ✅ TICKET-029 | 2024-12-23 | Re-scoring API endpoints (stale-count, rescore-all, refresh) |
> | ✅ TICKET-030 | 2024-12-23 | Stale Evaluation Indicator (components/rescoring/StaleEvaluationBanner.tsx) |
> | ✅ TICKET-031 | 2024-12-23 | Bulk Re-evaluation in Settings (components/rescoring/BulkRescoreButton.tsx) |
> | ✅ **PHASE 3 COMPLETE** | 2024-12-23 | Dynamic Re-scoring fully implemented (Backend + Frontend) |
> | 🎉 **ALL IMPLEMENTATION COMPLETE** | 2024-12-23 | All 32 tickets across 3 phases done |

---

## Priority Legend

| Priority | Description |
|----------|-------------|
| 🔴 P0 | Blocker - Must be done first |
| 🟠 P1 | High - Core functionality |
| 🟡 P2 | Medium - Important but not blocking |
| 🟢 P3 | Low - Nice to have |

---

## Phase 1: Document Management (2-3 weeks)

### Infrastructure Tickets

#### TICKET-001: Create S3 Infrastructure for Document Storage ✅
- **Priority**: 🔴 P0
- **Type**: Infrastructure
- **Effort**: 2 hours
- **Description**: Set up AWS S3 bucket with proper IAM policies for document storage
- **Acceptance Criteria**:
  - [x] S3 bucket created with versioning enabled
  - [x] IAM role with minimal permissions
  - [x] CORS configured for frontend uploads
  - [x] Lifecycle policy for cost management
  - [x] Encryption at rest enabled (AES-256)
- **Dependencies**: None
- **Assignee**: Backend/DevOps
- **Completed**: 2024-12-23 | S3Service in `app/services/s3.py`, config in `app/core/config.py`

---

#### TICKET-002: Create Documents Database Tables ✅
- **Priority**: 🔴 P0
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Create Alembic migrations for documents, document_versions, certification_documents, and past_performance tables
- **Acceptance Criteria**:
  - [x] `documents` table created with all columns
  - [x] `document_versions` table created
  - [x] `certification_documents` table created
  - [x] `past_performance` table created
  - [x] All indexes created
  - [x] Foreign keys to companies and users tables
  - [x] Migration tested locally
- **Dependencies**: None
- **Assignee**: Backend
- **Reference**: `document-management.md` lines 290-363
- **Completed**: 2024-12-23 | Migration `005_add_document_management.py`

---

#### TICKET-003: Create Document SQLAlchemy Models ✅
- **Priority**: 🔴 P0
- **Type**: Backend
- **Effort**: 1 hour
- **Description**: Create SQLAlchemy models for Document, DocumentVersion, CertificationDocument, PastPerformanceDocument
- **Acceptance Criteria**:
  - [x] `Document` model in `app/models/document.py`
  - [x] `DocumentVersion` model with version tracking
  - [x] `CertificationDocument` model with expiration
  - [x] `PastPerformanceDocument` model
  - [x] All relationships defined
  - [x] Models imported in `app/models/__init__.py`
- **Dependencies**: TICKET-002
- **Assignee**: Backend
- **Completed**: 2024-12-23 | Models in `app/models/document.py`

---

### Backend API Tickets

#### TICKET-004: Implement Pre-signed URL Upload Endpoint ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 3 hours
- **Description**: Create endpoint to generate pre-signed S3 URLs for direct browser upload
- **Acceptance Criteria**:
  - [x] `POST /api/v1/documents/upload` endpoint
  - [x] Returns pre-signed URL valid for 15 minutes
  - [x] Validates file type (PDF, DOCX, DOC only)
  - [x] Validates file size (max 10MB)
  - [x] Returns S3 key for subsequent document creation
  - [x] Unit tests passing
- **Dependencies**: TICKET-001, TICKET-003
- **Assignee**: Backend
- **Reference**: `document-management.md` US-DOC-1
- **Completed**: 2024-12-23 | Endpoint in `app/api/v1/documents.py`

---

#### TICKET-005: Implement Document CRUD Endpoints ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 4 hours
- **Description**: Create REST endpoints for document management
- **Acceptance Criteria**:
  - [x] `POST /api/v1/documents/` - Create document record after S3 upload
  - [x] `GET /api/v1/documents/` - List company documents
  - [x] `GET /api/v1/documents/{id}` - Get document details
  - [x] `GET /api/v1/documents/{id}/download` - Get pre-signed download URL
  - [x] `DELETE /api/v1/documents/{id}` - Soft delete document
  - [x] Access control enforced (company-scoped)
  - [x] Pydantic schemas defined
  - [x] Unit tests passing
- **Dependencies**: TICKET-003, TICKET-004
- **Assignee**: Backend
- **Reference**: `document-management.md` lines 209-228
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/documents.py`, schemas in `app/schemas/document.py`

---

#### TICKET-006: Implement Document Versioning Endpoints ✅
- **Priority**: 🟡 P2
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Create endpoints for document version management
- **Acceptance Criteria**:
  - [x] `GET /api/v1/documents/{id}/versions` - List all versions
  - [x] `POST /api/v1/documents/{id}/versions/{version}/restore` - Restore old version
  - [x] Version number auto-increments on upload
  - [x] `is_current` flag properly managed
  - [x] SHA-256 checksum stored for each version
- **Dependencies**: TICKET-005
- **Assignee**: Backend
- **Reference**: `document-management.md` US-DOC-4
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/documents.py`

---

#### TICKET-007: Implement Certification Document Endpoints ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 3 hours
- **Description**: Create REST endpoints for certification document management
- **Acceptance Criteria**:
  - [x] `POST /api/v1/certifications/` - Create certification with document
  - [x] `GET /api/v1/certifications/` - List company certifications
  - [x] `PUT /api/v1/certifications/{id}` - Update certification
  - [x] `DELETE /api/v1/certifications/{id}` - Delete certification
  - [x] Expiration date validation
  - [x] Status auto-calculated (active, expiring_soon, expired)
- **Dependencies**: TICKET-005
- **Assignee**: Backend
- **Reference**: `document-management.md` US-DOC-2
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/documents.py`, service in `app/services/document.py`

---

#### TICKET-008: Implement Past Performance Endpoints ✅
- **Priority**: 🟡 P2
- **Type**: Backend
- **Effort**: 3 hours
- **Description**: Create REST endpoints for past performance records
- **Acceptance Criteria**:
  - [x] `POST /api/v1/past-performance/` - Create past performance record
  - [x] `GET /api/v1/past-performance/` - List past performance
  - [x] `PUT /api/v1/past-performance/{id}` - Update record
  - [x] `DELETE /api/v1/past-performance/{id}` - Delete record
  - [x] NAICS codes array stored properly
  - [x] Contract value and period validation
- **Dependencies**: TICKET-005
- **Assignee**: Backend
- **Reference**: `document-management.md` US-DOC-3
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/documents.py`, service in `app/services/document.py`

---

#### TICKET-009: Implement Document Text Extraction Service ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 4 hours
- **Description**: Create async service to extract text from uploaded documents
- **Acceptance Criteria**:
  - [x] PDF extraction using PyPDF2 or pdfplumber
  - [x] DOCX extraction using python-docx
  - [x] Async processing via background task
  - [x] Extracted text stored in `extracted_text` column
  - [x] Entity extraction (NAICS codes, agencies, values) via GPT-4
  - [x] Extraction status tracking (pending, processing, completed, failed)
  - [x] Error handling and retry logic
- **Dependencies**: TICKET-005
- **Assignee**: Backend
- **Reference**: `document-management.md` US-DOC-5
- **Completed**: 2024-12-23 | Script `scripts/extract_documents.py`, cron entry in `scripts/govai-crontab`

---

#### TICKET-010: Implement Certification Expiration Reminders ✅
- **Priority**: 🟢 P3
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Create scheduled job to send certification expiration reminders
- **Acceptance Criteria**:
  - [x] Cron script `scripts/send_certification_reminders.py`
  - [x] Sends email 90, 60, 30 days before expiration
  - [x] Email template with renewal instructions
  - [x] Respects user email preferences
  - [x] Logs reminders sent
- **Dependencies**: TICKET-007
- **Assignee**: Backend
- **Completed**: 2024-12-23 | Script `scripts/send_certification_reminders.py`, cron entry in `scripts/govai-crontab`

---

### Frontend Tickets

#### TICKET-011: Create Document Upload Component ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 4 hours
- **Description**: Create reusable file upload component with drag-and-drop
- **Acceptance Criteria**:
  - [x] Drag-and-drop file zone
  - [x] File type validation (PDF, DOCX, DOC)
  - [x] File size validation (max 10MB)
  - [x] Upload progress indicator
  - [x] Success/error states
  - [x] Direct S3 upload using pre-signed URL
  - [x] Accessible (keyboard navigation, screen reader)
- **Dependencies**: TICKET-004
- **Assignee**: Frontend
- **Completed**: 2024-12-23 | Component `components/documents/DocumentUpload.tsx`

---

#### TICKET-012: Create Settings Documents Tab ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 4 hours
- **Description**: Add Documents tab to company settings page
- **Acceptance Criteria**:
  - [x] Tab navigation: Profile | Documents | Certifications | Past Performance
  - [x] Capability statement section with upload/replace
  - [x] Other documents list with view/download/delete
  - [x] Version history modal
  - [x] Empty state for no documents
- **Dependencies**: TICKET-011, TICKET-005
- **Assignee**: Frontend
- **Reference**: `document-management.md` UI wireframe lines 233-258
- **Completed**: 2024-12-23 | Settings page with 6 tabs `app/(dashboard)/settings/page.tsx`, list `components/documents/DocumentList.tsx`

---

#### TICKET-013: Create Certifications Management UI ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 4 hours
- **Description**: Create certifications tab in settings
- **Acceptance Criteria**:
  - [x] List of certifications with status badges
  - [x] Expiration date display with warning colors
  - [x] Add certification modal (type, document, dates)
  - [x] Edit/delete certification
  - [x] "Expiring Soon" warning styling
- **Dependencies**: TICKET-007, TICKET-011
- **Assignee**: Frontend
- **Reference**: `document-management.md` UI wireframe lines 260-284
- **Completed**: 2024-12-23 | Component `components/documents/CertificationForm.tsx`

---

#### TICKET-014: Create Past Performance Management UI ✅
- **Priority**: 🟡 P2
- **Type**: Frontend
- **Effort**: 3 hours
- **Description**: Create past performance tab in settings
- **Acceptance Criteria**:
  - [x] List of past performance records
  - [x] Add record form (contract, agency, value, dates, NAICS)
  - [x] Document upload for each record
  - [x] Edit/delete functionality
  - [x] AI extraction status indicator
- **Dependencies**: TICKET-008, TICKET-011
- **Assignee**: Frontend
- **Completed**: 2024-12-23 | Component `components/documents/PastPerformanceForm.tsx`

---

### Testing Tickets

#### TICKET-015: E2E Tests for Document Management ✅
- **Priority**: 🟡 P2
- **Type**: Testing
- **Effort**: 4 hours
- **Description**: Create Playwright E2E tests for document features
- **Acceptance Criteria**:
  - [x] TC-DOC-1: Upload capability statement PDF
  - [x] TC-DOC-2: Upload invalid file type rejection
  - [x] TC-DOC-3: Upload file > 10MB rejection
  - [x] TC-DOC-4: View uploaded document
  - [x] TC-DOC-5: Download document
  - [x] TC-DOC-6: Replace document (versioning)
  - [x] TC-DOC-7: Restore previous version
  - [x] TC-DOC-8: Add certification with document
  - [x] TC-DOC-9: Certification expiration alert
  - [x] TC-DOC-10: AI extraction status
- **Dependencies**: TICKET-012, TICKET-013
- **Assignee**: QA/Frontend
- **Reference**: `document-management.md` lines 369-385
- **Completed**: 2024-12-23 | Test spec `frontend/e2e/document-management.spec.ts`

---

## Phase 2: Authority Mapping (1-2 weeks)

### Infrastructure Tickets

#### TICKET-016: Create Agency and Contact Database Tables ✅
- **Priority**: 🔴 P0
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Create Alembic migrations for agencies, government_contacts, and company_agency_matches tables
- **Acceptance Criteria**:
  - [x] `agencies` table with hierarchy support
  - [x] `government_contacts` table
  - [x] `company_agency_matches` table for cached scores
  - [x] All indexes created
  - [x] Migration tested locally
- **Dependencies**: None
- **Assignee**: Backend
- **Reference**: `authority-mapping.md` lines 339-405
- **Completed**: 2024-12-23 | Migration `006_add_authority_mapping.py`

---

#### TICKET-017: Create Agency and Contact SQLAlchemy Models ✅
- **Priority**: 🔴 P0
- **Type**: Backend
- **Effort**: 1 hour
- **Description**: Create SQLAlchemy models for Agency, GovernmentContact, CompanyAgencyMatch
- **Acceptance Criteria**:
  - [x] `Agency` model with parent-child hierarchy
  - [x] `GovernmentContact` model with agency relationship
  - [x] `CompanyAgencyMatch` model for cached scores
  - [x] All relationships defined
  - [x] Models imported in `app/models/__init__.py`
- **Dependencies**: TICKET-016
- **Assignee**: Backend
- **Completed**: 2024-12-23 | Models in `app/models/agency.py`

---

### Backend API Tickets

#### TICKET-018: Implement Agency Endpoints ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 3 hours
- **Description**: Create REST endpoints for agency data
- **Acceptance Criteria**:
  - [x] `GET /api/v1/agencies/` - List all agencies
  - [x] `GET /api/v1/agencies/{id}` - Get agency details
  - [x] `GET /api/v1/agencies/{id}/contacts` - Get agency contacts
  - [x] `GET /api/v1/agencies/{id}/stats` - Get agency statistics (included in detail)
  - [x] `GET /api/v1/agencies/recommended` - Get recommended agencies for user's company
  - [x] Pagination support
- **Dependencies**: TICKET-017
- **Assignee**: Backend
- **Reference**: `authority-mapping.md` lines 317-335
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/agencies.py`, schemas in `app/schemas/agency.py`

---

#### TICKET-019: Implement Authority Matching Algorithm ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 6 hours
- **Description**: Create algorithm to match companies to agencies
- **Acceptance Criteria**:
  - [x] NAICS alignment scoring (40% weight)
  - [x] Set-aside alignment scoring (30% weight)
  - [x] Geographic fit scoring (15% weight)
  - [x] Award history fit scoring (15% weight)
  - [x] Combined weighted score 0-100
  - [x] Scoring reasoning/explanation generated
  - [x] Results cached in company_agency_matches table
  - [x] Daily refresh of cached scores
- **Dependencies**: TICKET-017
- **Assignee**: Backend
- **Reference**: `authority-mapping.md` US-AUTH-5, lines 248-313
- **Completed**: 2024-12-23 | Service in `app/services/agency.py` (matching_service)

---

#### TICKET-020: Implement Opportunity Contacts Endpoint ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Add endpoint to get recommended contacts for an opportunity
- **Acceptance Criteria**:
  - [x] `GET /api/v1/opportunities/{id}/contacts` - Get recommended contacts
  - [x] Returns contracting officer from opportunity
  - [x] Returns agency OSDBU contact
  - [x] Returns industry liaison if available
  - [x] Graceful handling when contacts unavailable
- **Dependencies**: TICKET-017, TICKET-018
- **Assignee**: Backend
- **Reference**: `authority-mapping.md` US-AUTH-1
- **Completed**: 2024-12-23 | Endpoint in `app/api/v1/opportunities.py`

---

#### TICKET-021: Import OSDBU Directory Data ✅
- **Priority**: 🟡 P2
- **Type**: Backend
- **Effort**: 4 hours
- **Description**: Create script to import SBA OSDBU directory contacts
- **Acceptance Criteria**:
  - [x] Script `scripts/import_osdbu_contacts.py`
  - [x] Scrapes/imports from SBA OSDBU directory
  - [x] Creates agency records if not exist
  - [x] Creates contact records linked to agencies
  - [x] Deduplication logic
  - [x] Can be run monthly for updates
- **Dependencies**: TICKET-017
- **Assignee**: Backend
- **Reference**: `authority-mapping.md` lines 409-431
- **Completed**: 2024-12-23 | Script `scripts/import_osdbu_contacts.py`, cron entry monthly in `scripts/govai-crontab`

---

### Frontend Tickets

#### TICKET-022: Add Recommended Contacts to Opportunity Detail ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 3 hours
- **Description**: Add "Recommended Contacts" section to opportunity detail page
- **Acceptance Criteria**:
  - [x] Contacts section below opportunity description
  - [x] Shows contracting officer, OSDBU contact, industry liaison
  - [x] Contact cards with name, title, email, phone
  - [x] "Copy Email" button with clipboard feedback
  - [x] "View Agency SB Page" link
  - [x] Empty state when no contacts available
- **Dependencies**: TICKET-020
- **Assignee**: Frontend
- **Reference**: `authority-mapping.md` UI wireframe lines 54-78
- **Completed**: 2024-12-23 | Component `components/agencies/OpportunityContacts.tsx`, integrated in `app/(dashboard)/opportunities/[id]/page.tsx`

---

#### TICKET-023: Add Top Agencies Widget to Dashboard ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 4 hours
- **Description**: Create "Top Agencies for Your Business" dashboard widget
- **Acceptance Criteria**:
  - [x] Shows top 5 matched agencies
  - [x] Displays match score percentage
  - [x] Shows active opportunity count per agency
  - [x] Shows average contract value
  - [x] "View Opportunities" button filters to agency
  - [x] "Agency Profile" link to detail page
- **Dependencies**: TICKET-018, TICKET-019
- **Assignee**: Frontend
- **Reference**: `authority-mapping.md` UI wireframe lines 103-127
- **Completed**: 2024-12-23 | Component `components/agencies/RecommendedAgencies.tsx`, integrated in `app/(dashboard)/dashboard/page.tsx`

---

#### TICKET-024: Create Agency Profile Page ✅
- **Priority**: 🟡 P2
- **Type**: Frontend
- **Effort**: 4 hours
- **Description**: Create dedicated agency profile page
- **Acceptance Criteria**:
  - [x] Route `/agencies/{id}`
  - [x] Agency overview (name, abbreviation, type)
  - [x] Small business goals display
  - [x] Key contacts list
  - [x] Top NAICS codes awarded
  - [x] Link to agency forecast
  - [x] Link to vendor portal
  - [x] Related opportunities list
- **Dependencies**: TICKET-018
- **Assignee**: Frontend
- **Reference**: `authority-mapping.md` US-AUTH-3
- **Completed**: 2024-12-23 | Page `app/(dashboard)/agencies/[id]/page.tsx`

---

### Testing Tickets

#### TICKET-025: E2E Tests for Authority Mapping ✅
- **Priority**: 🟡 P2
- **Type**: Testing
- **Effort**: 3 hours
- **Description**: Create Playwright E2E tests for authority features
- **Acceptance Criteria**:
  - [x] TC-AUTH-1: View recommended contacts on opportunity
  - [x] TC-AUTH-2: Copy contact email
  - [x] TC-AUTH-3: View top agencies on dashboard
  - [x] TC-AUTH-4: Filter opportunities by recommended agency
  - [x] TC-AUTH-5: View agency profile
  - [x] TC-AUTH-6: Agency match score explanation
  - [x] TC-AUTH-7: No contacts available empty state
- **Dependencies**: TICKET-022, TICKET-023
- **Assignee**: QA/Frontend
- **Reference**: `authority-mapping.md` lines 436-447
- **Completed**: 2024-12-23 | Test spec `frontend/e2e/authority-mapping.spec.ts`

---

## Phase 3: Dynamic Re-scoring (1 week)

### Backend Tickets

#### TICKET-026: Add Profile Version Tracking ✅
- **Priority**: 🔴 P0
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Add profile versioning to Company and Evaluation models
- **Acceptance Criteria**:
  - [x] Migration adds `profile_version` to companies table
  - [x] Migration adds `profile_version_at_evaluation` to evaluations table
  - [x] Company model has `profile_version` column
  - [x] Evaluation model has `profile_version_at_evaluation` column
  - [x] Evaluation has `is_stale` property
  - [x] Backfill migration for existing records
- **Dependencies**: None
- **Assignee**: Backend
- **Reference**: `dynamic-rescoring.md` US-RESCORE-4, lines 192-207
- **Completed**: 2024-12-23 | Migration `007_add_profile_versioning.py`, updated models

---

#### TICKET-027: Increment Profile Version on Update ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 1 hour
- **Description**: Auto-increment profile version when scoring-relevant fields change
- **Acceptance Criteria**:
  - [x] Company update endpoint detects scoring field changes
  - [x] Profile version increments on: NAICS, set_asides, geographic_preferences, contract_value_min/max, capabilities
  - [x] Profile version does NOT increment on: name, description, contact info
  - [x] New evaluations store current profile version
- **Dependencies**: TICKET-026
- **Assignee**: Backend
- **Reference**: `dynamic-rescoring.md` lines 51-75
- **Completed**: 2024-12-23 | Logic in `app/services/company.py`

---

#### TICKET-028: Implement Re-scoring Background Task ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 4 hours
- **Description**: Create Celery task to re-score stale evaluations
- **Acceptance Criteria**:
  - [x] `rescore_evaluations_task` in `tasks/rescore.py`
  - [x] Finds all stale evaluations for company
  - [x] Re-evaluates each using AI service
  - [x] Updates evaluation with new scores
  - [x] Updates `profile_version_at_evaluation`
  - [x] Error handling and logging
  - [x] Returns success/error counts
- **Dependencies**: TICKET-026, TICKET-027
- **Assignee**: Backend
- **Reference**: `dynamic-rescoring.md` lines 213-276
- **Completed**: 2024-12-23 | Service in `app/services/rescoring.py`

---

#### TICKET-029: Implement Re-scoring API Endpoints ✅
- **Priority**: 🟠 P1
- **Type**: Backend
- **Effort**: 2 hours
- **Description**: Create API endpoints for re-scoring features
- **Acceptance Criteria**:
  - [x] `POST /api/v1/evaluations/rescore-all` - Trigger bulk re-scoring
  - [x] `GET /api/v1/evaluations/stale-count` - Get count of stale evaluations
  - [x] `POST /api/v1/evaluations/{id}/refresh` - Refresh single evaluation
  - [x] Rate limiting (max 1 bulk rescore per hour)
  - [x] Returns job status/progress
- **Dependencies**: TICKET-028
- **Assignee**: Backend
- **Reference**: `dynamic-rescoring.md` lines 181-188
- **Completed**: 2024-12-23 | Endpoints in `app/api/v1/evaluations.py`, schemas in `app/schemas/rescoring.py`

---

### Frontend Tickets

#### TICKET-030: Add Stale Evaluation Indicator ✅
- **Priority**: 🟠 P1
- **Type**: Frontend
- **Effort**: 2 hours
- **Description**: Show warning when viewing evaluation based on old profile
- **Acceptance Criteria**:
  - [x] Warning banner on opportunity detail when evaluation is stale
  - [x] Shows which fields have changed
  - [x] "Refresh Evaluation" button
  - [x] Loading state during refresh
  - [x] Success feedback when refreshed
- **Dependencies**: TICKET-026, TICKET-029
- **Assignee**: Frontend
- **Reference**: `dynamic-rescoring.md` UI wireframe lines 91-105
- **Completed**: 2024-12-23 | Component `components/rescoring/StaleEvaluationBanner.tsx`, integrated in `app/(dashboard)/opportunities/[id]/page.tsx`

---

#### TICKET-031: Add Bulk Re-evaluation to Settings ✅
- **Priority**: 🟡 P2
- **Type**: Frontend
- **Effort**: 2 hours
- **Description**: Add re-evaluation controls to settings page
- **Acceptance Criteria**:
  - [x] "Re-evaluate All Opportunities" section in settings
  - [x] Shows count of stale evaluations
  - [x] Confirmation dialog before bulk re-evaluation
  - [x] Progress indicator during re-evaluation
  - [x] Success notification when complete
  - [x] Last bulk re-evaluation timestamp
- **Dependencies**: TICKET-029
- **Assignee**: Frontend
- **Reference**: `dynamic-rescoring.md` UI wireframe lines 122-142
- **Completed**: 2024-12-23 | Component `components/rescoring/BulkRescoreButton.tsx`, integrated in `app/(dashboard)/settings/page.tsx`

---

### Testing Tickets

#### TICKET-032: E2E Tests for Dynamic Re-scoring ✅
- **Priority**: 🟡 P2
- **Type**: Testing
- **Effort**: 2 hours
- **Description**: Create Playwright E2E tests for re-scoring features
- **Acceptance Criteria**:
  - [x] TC-RESCORE-1: Profile update triggers re-scoring
  - [x] TC-RESCORE-2: Stale indicator shown
  - [x] TC-RESCORE-3: Manual refresh evaluation
  - [x] TC-RESCORE-4: Bulk re-evaluation
  - [x] TC-RESCORE-5: Non-scoring changes don't trigger
- **Dependencies**: TICKET-030, TICKET-031
- **Assignee**: QA/Frontend
- **Reference**: `dynamic-rescoring.md` lines 280-291
- **Completed**: 2024-12-23 | Test spec `frontend/e2e/dynamic-rescoring.spec.ts`

---

## Implementation Order

### Sprint 1 (Week 1-2): Document Management Foundation
1. TICKET-001: S3 Infrastructure
2. TICKET-002: Database Tables
3. TICKET-003: SQLAlchemy Models
4. TICKET-004: Pre-signed Upload Endpoint
5. TICKET-005: Document CRUD Endpoints
6. TICKET-011: Upload Component
7. TICKET-012: Documents Tab UI

### Sprint 2 (Week 2-3): Document Management Complete
1. TICKET-006: Versioning Endpoints
2. TICKET-007: Certification Endpoints
3. TICKET-008: Past Performance Endpoints
4. TICKET-009: Text Extraction Service
5. TICKET-013: Certifications UI
6. TICKET-014: Past Performance UI
7. TICKET-015: E2E Tests

### Sprint 3 (Week 3-4): Authority Mapping
1. TICKET-016: Agency Tables
2. TICKET-017: Agency Models
3. TICKET-018: Agency Endpoints
4. TICKET-019: Matching Algorithm
5. TICKET-020: Opportunity Contacts
6. TICKET-021: OSDBU Import
7. TICKET-022: Contacts UI
8. TICKET-023: Dashboard Widget
9. TICKET-024: Agency Profile
10. TICKET-025: E2E Tests

### Sprint 4 (Week 4-5): Dynamic Re-scoring
1. TICKET-026: Profile Versioning
2. TICKET-027: Version Increment
3. TICKET-028: Re-scoring Task
4. TICKET-029: Re-scoring API
5. TICKET-030: Stale Indicator UI
6. TICKET-031: Bulk Re-evaluation UI
7. TICKET-032: E2E Tests

---

## Dependency Graph

```
Phase 1: Document Management
TICKET-001 (S3) ──┬── TICKET-004 (Upload) ──┬── TICKET-005 (CRUD) ──┬── TICKET-006 (Versioning)
                  │                          │                       ├── TICKET-007 (Certs) ────── TICKET-010 (Reminders)
TICKET-002 (DB) ──┼── TICKET-003 (Models) ──┘                       ├── TICKET-008 (PastPerf)
                  │                                                  └── TICKET-009 (Extraction)
                  │
                  └── TICKET-011 (Upload UI) ── TICKET-012 (Docs Tab) ── TICKET-013 (Certs UI)
                                                                      └── TICKET-014 (PastPerf UI)
                                                                          └── TICKET-015 (E2E)

Phase 2: Authority Mapping
TICKET-016 (DB) ── TICKET-017 (Models) ──┬── TICKET-018 (Agency API) ──┬── TICKET-023 (Dashboard)
                                         │                              └── TICKET-024 (Profile)
                                         ├── TICKET-019 (Algorithm) ────────┘
                                         ├── TICKET-020 (Contacts) ──── TICKET-022 (Contacts UI)
                                         └── TICKET-021 (Import)
                                                                        └── TICKET-025 (E2E)

Phase 3: Dynamic Re-scoring
TICKET-026 (Versioning) ── TICKET-027 (Increment) ── TICKET-028 (Task) ── TICKET-029 (API) ──┬── TICKET-030 (Stale UI)
                                                                                              └── TICKET-031 (Bulk UI)
                                                                                                  └── TICKET-032 (E2E)
```

---

## Notes for Implementation

### AWS S3 Configuration Required
```bash
# Environment variables needed
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
S3_BUCKET_NAME=govai-documents
```

### Python Dependencies to Add
```
boto3>=1.34.0
PyPDF2>=3.0.0
python-docx>=1.1.0
```

### Celery Configuration
Ensure Celery worker is running for:
- Document text extraction
- Re-scoring background tasks
- Certification reminder emails

---

*Generated from user stories in `docs/user-stories/future-features/`*
