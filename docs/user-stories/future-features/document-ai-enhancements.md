# Document AI Enhancement User Stories

## Overview
These user stories cover two enhancements to the existing document extraction system:
1. OCR support for scanned PDF documents
2. Auto-population of company profile from extracted document entities

---

## Epic 1: OCR Support for Scanned PDFs

### User Story 1.1: Extract Text from Scanned PDFs
**As a** small business owner
**I want** the system to extract text from scanned PDF capability statements
**So that** I can upload any PDF format and still benefit from AI analysis

**Acceptance Criteria:**
- [ ] System detects when a PDF contains scanned images vs text
- [ ] OCR processing extracts text from image-based PDF pages
- [ ] Extracted text is stored in `extracted_text` field
- [ ] Processing handles mixed PDFs (some text pages, some scanned)
- [ ] Error handling for unreadable/corrupted scans
- [ ] Extraction status updates appropriately (pending → processing → completed/failed)

**Technical Notes:**
- Use `pdf2image` to convert PDF pages to images
- Use `pytesseract` for OCR text extraction
- Fall back to PyPDF2 for text-based pages
- Add dependencies to requirements.txt

---

### User Story 1.2: OCR Quality Indicators
**As a** user who uploaded a scanned document
**I want** to see the quality/confidence of the OCR extraction
**So that** I know if I should re-upload a clearer document

**Acceptance Criteria:**
- [ ] OCR confidence score stored with extracted text
- [ ] Low confidence triggers a warning to user
- [ ] UI displays extraction quality indicator (Good/Fair/Poor)
- [ ] Suggestion to re-upload if quality is poor

**Technical Notes:**
- Tesseract provides confidence scores per word
- Calculate average confidence across document
- Store in `extracted_entities.ocr_confidence`

---

## Epic 2: Auto-Populate Company Profile from Documents

### User Story 2.1: Suggest Profile Fields from Capability Statement
**As a** new user who just uploaded my capability statement
**I want** the system to suggest NAICS codes, certifications, and capabilities extracted from my document
**So that** I can quickly complete my profile without manual data entry

**Acceptance Criteria:**
- [ ] After document extraction completes, system identifies extractable profile fields
- [ ] Extracted NAICS codes are suggested to user
- [ ] Extracted certifications (8(a), WOSB, SDVOSB, HUBZone) are suggested
- [ ] Extracted capabilities/services are suggested for capabilities statement
- [ ] User can review and accept/reject each suggestion
- [ ] Accepted suggestions auto-populate company profile
- [ ] User can edit suggestions before accepting

**Technical Notes:**
- Create new API endpoint: `POST /api/v1/documents/{id}/apply-to-profile`
- Add frontend component for reviewing extracted suggestions
- Match extracted NAICS codes against reference data
- Validate certification types against known set-asides

---

### User Story 2.2: Notification of Extracted Data Available
**As a** user who uploaded a document
**I want** to be notified when extraction is complete and suggestions are ready
**So that** I know to review the extracted data

**Acceptance Criteria:**
- [ ] Dashboard shows notification when document extraction completes
- [ ] Notification indicates how many profile fields can be auto-populated
- [ ] Click notification navigates to suggestion review screen
- [ ] Notification dismisses after user reviews suggestions

**Technical Notes:**
- Add `suggestions_reviewed` boolean to Document model
- Dashboard polls or uses websocket for extraction status
- Badge/notification component in UI

---

### User Story 2.3: Bulk Apply Suggestions
**As a** user with multiple documents processed
**I want** to review all extracted suggestions at once
**So that** I can quickly populate my profile from all my documents

**Acceptance Criteria:**
- [ ] Settings page shows all documents with pending suggestions
- [ ] User can select which suggestions to apply
- [ ] Duplicate/conflicting suggestions are highlighted
- [ ] One-click "Apply All" option available
- [ ] Profile updates with selected suggestions

**Technical Notes:**
- Aggregate suggestions from all company documents
- De-duplicate NAICS codes, certifications
- Merge capabilities text intelligently

---

### User Story 2.4: Certification Expiration Detection
**As a** user who uploaded certification documents
**I want** the system to extract expiration dates from my certifications
**So that** I receive timely renewal reminders

**Acceptance Criteria:**
- [ ] AI extracts expiration dates from certification documents
- [ ] Dates are suggested for certification records
- [ ] User can confirm/edit expiration dates
- [ ] Confirmed dates trigger reminder system

**Technical Notes:**
- Enhance AI prompt to specifically look for dates
- Date parsing with multiple format support
- Link to existing certification reminder system

---

## Implementation Tickets

### Backend Tickets

#### Ticket BE-OCR-001: Add OCR Dependencies and Utilities ✅ COMPLETED
**Priority:** High
**Estimate:** 2 hours
**Completed:** 2024-12-23
**Description:** Add pytesseract and pdf2image to requirements.txt. Create OCR utility functions.

**Tasks:**
- [x] Add `pytesseract>=0.3.10` to requirements.txt
- [x] Add `pdf2image>=1.16.0` to requirements.txt
- [x] Create `app/services/ocr.py` with OCR functions
- [x] Add Tesseract installation to deployment docs (in this file)

**Files modified:**
- `backend/requirements.txt` - Added pytesseract, pdf2image, Pillow
- `backend/app/services/ocr.py` - Created with OCRResult dataclass, extract_text_with_ocr(), get_ocr_quality_label(), check_ocr_system_dependencies()

---

#### Ticket BE-OCR-002: Integrate OCR into Document Extraction ✅ COMPLETED
**Priority:** High
**Estimate:** 2 hours
**Completed:** 2024-12-23
**Description:** Update extract_documents.py to use OCR for scanned PDFs.

**Tasks:**
- [x] Detect if PDF page is text-based or image-based
- [x] Apply OCR to image-based pages
- [x] Combine text from both extraction methods
- [x] Store OCR confidence score
- [x] Update extraction_status appropriately

**Files modified:**
- `backend/scripts/extract_documents.py` - Updated extract_pdf_text() to use OCR service, updated process_document() to store OCR metadata
- `backend/app/models/document.py` - Added ocr_confidence, is_scanned, suggestions_reviewed fields
- `backend/alembic/versions/007_add_document_ocr_fields.py` - Migration for new fields

---

#### Ticket BE-PROFILE-001: Create Profile Suggestion Endpoint ✅ COMPLETED
**Priority:** High
**Estimate:** 3 hours
**Completed:** 2024-12-23
**Description:** Create API endpoint to apply document extractions to company profile.

**Tasks:**
- [x] Create `GET /api/v1/documents/{id}/suggestions` endpoint
- [x] Return extracted entities mapped to profile fields
- [x] Create `POST /api/v1/documents/{id}/apply-suggestions` endpoint
- [x] Validate and apply selected suggestions to company profile
- [x] Update company profile_version after changes

**Files modified:**
- `backend/app/api/v1/documents.py` - Added 3 endpoints: GET suggestions, POST apply-suggestions, POST mark-reviewed
- `backend/app/schemas/document.py` - Added SuggestedNAICS, SuggestedCertification, DocumentSuggestionsResponse, ApplySuggestionsRequest/Response
- `backend/app/services/document.py` - Added get_certification_by_type() method

---

#### Ticket BE-PROFILE-002: Enhanced AI Entity Extraction ✅ COMPLETED
**Priority:** Medium
**Estimate:** 2 hours
**Completed:** 2024-12-23
**Description:** Improve AI prompt to extract more structured profile data.

**Tasks:**
- [x] Update AI prompt to extract certification expiration dates
- [x] Extract company address/location
- [x] Extract contract value ranges from past performance
- [x] Better NAICS code matching against reference data

**Files modified:**
- `backend/scripts/extract_documents.py` - Enhanced AI prompt with 10 structured extraction fields including certifications with expiration dates, company_info, past_performance details, contract_value_range, DUNS/CAGE codes

---

### Frontend Tickets

#### Ticket FE-SUGGEST-001: Document Suggestions Review Component ✅ COMPLETED
**Priority:** High
**Estimate:** 4 hours
**Completed:** 2024-12-23
**Description:** Create UI component for reviewing and applying extracted suggestions.

**Tasks:**
- [x] Create `DocumentSuggestions` component
- [x] Display extracted NAICS codes with checkboxes
- [x] Display extracted certifications with checkboxes
- [x] Display extracted capabilities text with edit option
- [x] "Apply Selected" and "Apply All" buttons
- [x] Success/error feedback

**Files created/modified:**
- `frontend/components/documents/DocumentSuggestions.tsx` - Full suggestions review component with selection, OCR quality display, and apply functionality
- `frontend/components/ui/checkbox.tsx` - Created Checkbox UI component using Radix UI
- `frontend/lib/documents.ts` - Added suggestion types and API functions (getDocumentSuggestions, applyDocumentSuggestions, markSuggestionsReviewed)
- `package.json` - Added @radix-ui/react-checkbox dependency

---

#### Ticket FE-SUGGEST-002: Extraction Status Notification ✅ COMPLETED
**Priority:** Medium
**Estimate:** 2 hours
**Completed:** 2024-12-23
**Description:** Add notification when document extraction completes.

**Tasks:**
- [x] Poll document extraction status after upload
- [x] Show notification badge when suggestions available
- [x] Link to suggestions review
- [x] Dismiss notification after review

**Files modified:**
- `frontend/types/document.ts` - Added ocr_confidence, is_scanned, suggestions_reviewed fields to Document interface
- `frontend/components/documents/DocumentUpload.tsx` - Added extraction status polling with onExtractionComplete callback
- `frontend/components/documents/DocumentList.tsx` - Added suggestions badge and "Review Suggestions" button with onViewSuggestions callback
- `frontend/components/documents/index.ts` - Added DocumentSuggestions export
- `frontend/app/(dashboard)/settings/page.tsx` - Integrated DocumentSuggestions component, added pending suggestions alert, tab badge notification

---

#### Ticket FE-OCR-001: OCR Quality Indicator ✅ COMPLETED
**Priority:** Low
**Estimate:** 1 hour
**Completed:** 2024-12-23
**Description:** Display OCR quality indicator for scanned documents.

**Tasks:**
- [x] Show extraction quality badge (Good/Fair/Poor)
- [x] Warning message for low quality extractions
- [x] Suggest re-upload for poor quality

**Files modified:**
- `frontend/components/documents/DocumentList.tsx` - Added getOcrQualityInfo() helper, OCR quality badge, "Scanned (OCR)" indicator, and poor quality warning message

---

## Summary

| Ticket | Description | Estimate | Priority |
|--------|-------------|----------|----------|
| BE-OCR-001 | OCR dependencies and utilities | 2h | High |
| BE-OCR-002 | Integrate OCR into extraction | 2h | High |
| BE-PROFILE-001 | Profile suggestion endpoints | 3h | High |
| BE-PROFILE-002 | Enhanced AI extraction | 2h | Medium |
| FE-SUGGEST-001 | Suggestions review component | 4h | High |
| FE-SUGGEST-002 | Extraction notification | 2h | Medium |
| FE-OCR-001 | OCR quality indicator | 1h | Low |

**Total Estimate:** 16 hours

---

## Dependencies

### System Dependencies (for OCR):
```bash
# Ubuntu/Debian
apt-get install tesseract-ocr poppler-utils

# macOS
brew install tesseract poppler

# Amazon Linux
yum install tesseract poppler-utils
```

### Python Dependencies:
```
pytesseract>=0.3.10
pdf2image>=1.16.0
```
