# GovAI New Frontend - User Stories & Implementation Status

This document lists features that were identified as missing or incomplete in the new Vite + React frontend (`froentend-new`) compared to the documented functionality in `docs/END_TO_END_FUNCTIONALITY.md`.

**Last Updated**: December 24, 2025

---

## Critical Missing Features

### 1. Agency Detail Page
**Status**: IMPLEMENTED
**Priority**: High
**Route**: `/agencies/:id`

**User Story**:
As a user, I want to view detailed information about a specific agency so I can understand my company's alignment with them and find key contacts.

**Acceptance Criteria**:
- [x] Add route `/agencies/:id` to `App.tsx`
- [x] Create `AgencyDetailPage` component
- [x] Display agency details (name, abbreviation, level)
- [x] Show match score breakdown (NAICS, set-aside, geographic, award history factors)
- [x] Display small business goals (8(a), WOSB, SDVOSB, HUBZone percentages)
- [x] List key contacts (OSDBU, industry liaison) with contact info
- [x] Include quick links (opportunities, small business page, forecast, vendor portal)

**Implementation**:
- `src/components/agencies/AgencyDetailPage.tsx`
- `src/lib/agencies.ts` (API functions)

---

### 2. Document Management (Full Implementation)
**Status**: IMPLEMENTED
**Priority**: High
**Location**: Settings > Documents Tab

**User Story**:
As a user, I want to upload capability statements and other documents so the AI can extract information and improve my company profile matching.

**Acceptance Criteria**:
- [x] Implement actual file upload functionality with S3 presigned URLs
- [x] Create `DocumentUpload` component with progress indicator
- [x] Create `DocumentList` component to display uploaded documents
- [x] Support document types: capability_statement, certification, past_performance, other
- [x] Display document extraction status (pending, processing, completed, failed)
- [x] Implement download functionality with presigned URLs
- [x] Add delete document functionality

**Implementation**:
- `src/components/documents/DocumentUpload.tsx`
- `src/components/documents/DocumentList.tsx`
- `src/lib/documents.ts`
- `src/types/document.ts`

---

### 3. Document AI Suggestions
**Status**: IMPLEMENTED
**Priority**: High
**Location**: Settings > Documents Tab

**User Story**:
As a user, I want to review AI-extracted suggestions from my uploaded documents so I can quickly populate my company profile with accurate information.

**Acceptance Criteria**:
- [x] Create `DocumentSuggestions` component
- [x] Display extracted NAICS codes with confidence scores
- [x] Display extracted certifications
- [x] Display extracted capabilities text
- [x] Display extracted agencies/locations/contract values
- [x] Allow user to accept/reject individual suggestions
- [x] Implement "Apply Suggestions" functionality
- [x] Mark documents as reviewed after applying suggestions
- [x] Show OCR quality indicator for scanned documents

**Implementation**:
- `src/components/documents/DocumentSuggestions.tsx`

---

### 4. Certifications Management
**Status**: IMPLEMENTED
**Priority**: High
**Location**: Settings > Certifications Tab

**User Story**:
As a user, I want to manage my company's certifications so the system can match me with appropriate set-aside opportunities.

**Acceptance Criteria**:
- [x] Add "Certifications" tab to Settings page
- [x] Create `CertificationForm` component
- [x] Display certification list with status (active, expiring soon, expired)
- [x] Show days until expiration
- [x] Allow adding new certifications (type, document, dates)
- [x] Allow editing existing certifications
- [x] Allow deleting certifications
- [x] Visual indicator for expiring certifications

**Implementation**:
- `src/components/documents/CertificationsForm.tsx`
- `src/components/settings/SettingsPage.tsx` (Certifications tab)

---

### 5. Past Performance Records
**Status**: IMPLEMENTED
**Priority**: High
**Location**: Settings > Past Performance Tab

**User Story**:
As a user, I want to track my company's past contract performance so the AI can better evaluate my fit for similar opportunities.

**Acceptance Criteria**:
- [x] Add "Past Performance" tab to Settings page
- [x] Create `PastPerformanceForm` component
- [x] Display list of past performance records
- [x] Fields: contract number, agency, value, period of performance, NAICS, rating, description
- [x] Allow adding new records
- [x] Allow editing existing records
- [x] Allow deleting records

**Implementation**:
- `src/components/documents/PastPerformanceForm.tsx`
- `src/components/settings/SettingsPage.tsx` (Past Performance tab)

---

### 6. Stale Evaluation Detection & Bulk Rescore
**Status**: IMPLEMENTED
**Priority**: High
**Location**: Dashboard / Opportunities Page

**User Story**:
As a user, when I update my company profile, I want to see which opportunity evaluations are stale and be able to re-score them with my updated profile.

**Acceptance Criteria**:
- [x] Show stale evaluation count on Dashboard
- [x] Add visual indicator on individual opportunity cards when evaluation is stale
- [x] Add "Rescore All" button when stale evaluations exist
- [x] Show progress/status during bulk rescore
- [x] Allow individual evaluation refresh from opportunity detail page
- [x] Display current profile version

**Implementation**:
- `src/components/dashboard/StaleEvaluationAlert.tsx`
- `src/components/dashboard/DashboardPage.tsx` (stale indicators)
- `src/components/opportunities/OpportunityDetailPage.tsx` (rescore button)
- `src/lib/opportunities.ts` (API functions)
- `src/types/opportunity.ts` (types and helper)

---

## Medium Priority Features

### 7. Notification Settings Persistence
**Status**: IMPLEMENTED
**Priority**: Medium
**Location**: Settings > Notifications Tab

**User Story**:
As a user, I want my notification preferences to be saved so I receive emails at my preferred frequency.

**Acceptance Criteria**:
- [x] Save email frequency to backend via `PUT /api/v1/auth/me`
- [x] Load current email frequency from user profile on page load
- [x] Show success/error feedback when saving

**Implementation**:
- `src/components/settings/SettingsPage.tsx` (Notifications tab with useMutation)

---

### 8. Password Change Functionality
**Status**: IMPLEMENTED
**Priority**: Medium
**Location**: Settings > Account Tab

**User Story**:
As a user, I want to change my password from the settings page.

**Acceptance Criteria**:
- [x] Enable password change form
- [x] Validate current password
- [x] Validate new password (min 8 chars, match confirmation)
- [x] Call API to update password
- [x] Show success/error feedback

**Implementation**:
- `src/components/settings/SettingsPage.tsx` (Account tab)

---

### 9. User Profile Update
**Status**: IMPLEMENTED
**Priority**: Medium
**Location**: Settings > Account Tab

**User Story**:
As a user, I want to update my first and last name from the settings page.

**Acceptance Criteria**:
- [x] Enable first/last name fields for editing
- [x] Add save button for account details
- [x] Call `PUT /api/v1/auth/me` with updated data
- [x] Show success/error feedback

**Implementation**:
- `src/components/settings/SettingsPage.tsx` (Account tab with useMutation)

---

## Bug Fixes Required

### 10. Login Page React Warning
**Status**: FIXED
**Priority**: Medium
**Location**: `LoginPage.tsx`

**Issue**: Console error "Cannot update a component while rendering a different component"

**Fix Applied**:
- [x] Reviewed state updates in LoginPage component
- [x] Moved setState calls out of render cycle
- [x] Navigation now happens in useEffect after auth state change

**Implementation**:
- `src/components/auth/LoginPage.tsx` (useEffect for navigation)

---

### 11. Dashboard Auth State Loading Issue
**Status**: FIXED
**Priority**: High
**Location**: `useAuth.tsx` / `ProtectedRoute`

**Issue**: Dashboard shows infinite loading spinner after login navigation

**Symptoms**:
- Login API succeeds
- Navigation to /dashboard occurs
- Page stays in loading state
- Backend requests don't fire from dashboard

**Fix Applied**:
- [x] Fixed auth state propagation after login
- [x] Ensured token is stored before navigation
- [x] ProtectedRoute now receives updated auth state correctly

**Implementation**:
- `src/components/auth/LoginPage.tsx` (proper useEffect navigation pattern)

---

## Nice-to-Have Enhancements

### 12. Force Discovery Refresh
**Status**: Not Exposed (Low Priority)
**Priority**: Low

**User Story**:
As a user, I want to force a fresh discovery from SAM.gov bypassing the cache.

**Acceptance Criteria**:
- [ ] Add option to "Discover New" button for force refresh
- [ ] Pass `force_refresh=true` to trigger discovery endpoint

**Note**: Backend supports this, but UI option not yet added.

---

### 13. Opportunity Contacts Display
**Status**: Implemented
**Priority**: Low
**Location**: Opportunity Detail Page

**User Story**:
As a user, I want to see contracting officer and OSDBU contact information on opportunity details.

**Acceptance Criteria**:
- [x] Verify contacts are displayed on OpportunityDetailPage
- [x] Show contracting officer info
- [x] Show OSDBU contact info
- [ ] Link to agency profile from contacts section

**Implementation**:
- `src/components/opportunities/OpportunityDetailPage.tsx` (Contact Information card)

---

### 14. AI Settings Tab
**Status**: Not Implemented (Low Priority)
**Priority**: Low
**Location**: Settings (New Tab)

**User Story**:
As a user, I want to configure AI evaluation preferences (if applicable).

**Note**: This was mentioned in some docs but may not have backend support. Deferred.

---

## Summary

| Category | Total | Implemented | Pending |
|----------|-------|-------------|---------|
| Critical Missing Features | 6 | 6 | 0 |
| Medium Priority Features | 3 | 3 | 0 |
| Bug Fixes | 2 | 2 | 0 |
| Nice-to-Have | 3 | 1 | 2 |
| **Total** | **14** | **12** | **2** |

## Implementation Status

### Completed (12/14)
1. Agency Detail Page
2. Document Management with S3 Upload
3. Document AI Suggestions
4. Certifications Management
5. Past Performance Records
6. Stale Evaluation Detection & Bulk Rescore
7. Notification Settings Persistence
8. Password Change Functionality
9. User Profile Update
10. Login Page React Warning Fix
11. Dashboard Auth State Loading Fix
12. Opportunity Contacts Display

### Remaining Nice-to-Have (2/14)
1. Force Discovery Refresh (Low priority - backend ready)
2. AI Settings Tab (Low priority - may not be needed)

---

## Files Created/Modified

### New Components
- `src/components/agencies/AgencyDetailPage.tsx`
- `src/components/documents/DocumentUpload.tsx`
- `src/components/documents/DocumentList.tsx`
- `src/components/documents/DocumentSuggestions.tsx`
- `src/components/documents/CertificationsForm.tsx`
- `src/components/documents/PastPerformanceForm.tsx`
- `src/components/documents/index.ts`
- `src/components/dashboard/StaleEvaluationAlert.tsx`
- `src/components/dashboard/index.ts`

### New Libraries
- `src/lib/documents.ts`

### New Types
- `src/types/document.ts`

### Modified Files
- `src/App.tsx` (agency detail route)
- `src/components/auth/LoginPage.tsx` (auth bug fix)
- `src/components/agencies/AgenciesPage.tsx` (links to detail)
- `src/components/dashboard/DashboardPage.tsx` (stale alerts)
- `src/components/opportunities/OpportunityDetailPage.tsx` (rescore button)
- `src/components/settings/SettingsPage.tsx` (6 tabs, full functionality)
- `src/lib/opportunities.ts` (stale/rescore APIs)
- `src/types/opportunity.ts` (stale types)
- `src/types/index.ts` (document export)
