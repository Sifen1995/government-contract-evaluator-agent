# GovAI - End-to-End Functionality Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Configuration](#configuration)
4. [Authentication Module](#authentication-module)
5. [Onboarding Module](#onboarding-module)
6. [Company Profile Module](#company-profile-module)
7. [Opportunities Module](#opportunities-module)
8. [Pipeline Management Module](#pipeline-management-module)
9. [Analytics Module](#analytics-module)
10. [Agency Matching Module](#agency-matching-module)
11. [Document Management Module](#document-management-module)
12. [AI Evaluation & Rescoring Module](#ai-evaluation--rescoring-module)
13. [Email & Notifications Module](#email--notifications-module)
14. [Reference Data Module](#reference-data-module)
15. [API Endpoint Reference](#api-endpoint-reference)

---

## Overview

GovAI is an AI-powered government contract discovery platform that:
- Discovers opportunities from SAM.gov automatically
- Evaluates contracts using OpenAI GPT-4
- Provides BID/NO_BID/RESEARCH recommendations
- Manages pipeline from discovery to won/lost
- Supports document upload with AI extraction
- Offers agency matching and recommendations

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Python 3.9+ + FastAPI + SQLAlchemy + MySQL
- **AI**: OpenAI GPT-4
- **Email**: SendGrid (console mode for dev)
- **Storage**: AWS S3 for documents

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────────┤
│  Pages:                                                             │
│  - /login, /register, /forgot-password, /reset-password, /verify    │
│  - /onboarding                                                      │
│  - /dashboard                                                       │
│  - /opportunities, /opportunities/[id]                              │
│  - /pipeline                                                        │
│  - /analytics                                                       │
│  - /agencies, /agencies/[id]                                        │
│  - /settings (profile, documents, certifications, notifications)    │
│  - /unsubscribe                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (FastAPI)                       │
├─────────────────────────────────────────────────────────────────────┤
│  Routes:                                                            │
│  - /api/v1/auth/*          Authentication                           │
│  - /api/v1/company/*       Company Profile                          │
│  - /api/v1/opportunities/* Opportunities & Evaluations              │
│  - /api/v1/evaluations/*   Rescoring & Stale Detection              │
│  - /api/v1/agencies/*      Agency Matching                          │
│  - /api/v1/documents/*     Document Management                      │
│  - /api/v1/awards/*        Award Analytics                          │
│  - /api/v1/reference/*     Reference Data                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────────┤
│  - SAM.gov API       → Opportunity Discovery                        │
│  - OpenAI GPT-4      → AI Evaluation & Scoring                      │
│  - SendGrid          → Email Notifications                          │
│  - AWS S3            → Document Storage                             │
│  - MySQL             → Database                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MySQL connection string | - | Yes |
| `JWT_SECRET` | Auth secret (min 32 chars) | - | Yes |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` | No |
| `JWT_EXPIRY_HOURS` | Token expiry in hours | `24` | No |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` | No |
| `API_URL` | Backend API URL | `http://localhost:8000` | No |
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` | No |
| `SAM_API_KEY` | SAM.gov API key | - | Yes (production) |
| `OPENAI_API_KEY` | OpenAI API key | - | Yes (production) |
| `EMAIL_MODE` | `console` or `sendgrid` | `console` | No |
| `EMAIL_FROM` | Sender email | `noreply@govai.com` | No |
| `SENDGRID_API_KEY` | SendGrid API key | - | If EMAIL_MODE=sendgrid |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | For S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS secret | - | For S3 uploads |
| `AWS_REGION` | AWS region | `us-east-1` | No |
| `S3_BUCKET_NAME` | S3 bucket name | `govai-documents` | No |
| `S3_PRESIGNED_URL_EXPIRY` | URL expiry (seconds) | `900` | No |
| `DEBUG` | Debug mode | `true` | No |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |

---

## Authentication Module

### UI Pages

#### 1. Login Page (`/login`)
**File**: `frontend/app/(auth)/login/page.tsx`

**Functionality**:
- Email/password login form
- "Forgot password?" link
- "Sign up" link
- Auto-redirect to dashboard on success

**API Interaction**:
```
POST /api/v1/auth/login
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true,
    "first_name": "John",
    "last_name": "Doe",
    "email_frequency": "daily",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 2. Register Page (`/register`)
**File**: `frontend/app/(auth)/register/page.tsx`

**Functionality**:
- Registration form (email, password, first/last name)
- Password validation (min 8 chars, confirmation match)
- Shows success message with "check email" instruction

**API Interaction**:
```
POST /api/v1/auth/register
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "email_verified": false,
  "first_name": "John",
  "last_name": "Doe",
  "email_frequency": "daily",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Rate Limit**: 5 requests/minute

#### 3. Forgot Password Page (`/forgot-password`)
**File**: `frontend/app/(auth)/forgot-password/page.tsx`

**Functionality**:
- Email input for password reset
- Always shows success (security: doesn't reveal if email exists)

**API Interaction**:
```
POST /api/v1/auth/forgot-password
```

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Rate Limit**: 3 requests/minute

#### 4. Reset Password Page (`/reset-password`)
**File**: `frontend/app/(auth)/reset-password/page.tsx`

**Functionality**:
- Requires token from URL query param
- New password + confirmation
- Redirects to login on success

**API Interaction**:
```
POST /api/v1/auth/reset-password
```

**Request**:
```json
{
  "token": "reset-token-from-email",
  "new_password": "newpassword123"
}
```

**Response**:
```json
{
  "message": "Password reset successfully"
}
```

#### 5. Email Verification Page (`/verify-email`)
**File**: `frontend/app/(auth)/verify-email/page.tsx`

**Functionality**:
- Auto-verifies on page load using token from URL
- Shows loading/success/error states

**API Interaction**:
```
POST /api/v1/auth/verify-email
```

**Request**:
```json
{
  "token": "verification-token-from-email"
}
```

**Response**:
```json
{
  "message": "Email verified successfully"
}
```

### Authentication Storage

**Token Storage**: `localStorage`
- Key: `govai_token`
- Value: JWT access token

**User Storage**: `localStorage`
- Key: `govai_user`
- Value: JSON-serialized user object

### Auth Hook (`useAuth`)

**Functions**:
- `login(credentials)` - Login and store token
- `logout()` - Clear token and redirect
- `user` - Current user object
- `loading` - Auth loading state
- `isAuthenticated` - Boolean check

---

## Onboarding Module

### UI Page

#### Onboarding Page (`/onboarding`)
**File**: `frontend/app/onboarding/page.tsx`

**Functionality**:
3-step wizard for new users without a company profile:

**Step 1: Company Information**
- Company name (required)
- Legal structure dropdown
- UEI (Unique Entity Identifier)
- Address (street, city, state, ZIP)

**Step 2: NAICS & Certifications**
- NAICS codes multi-select (max 10)
- Set-aside certifications multi-select
- Contract value range
- Geographic preferences

**Step 3: Capabilities**
- Capabilities statement textarea (max 500 words)
- Review summary before submission

**API Interactions**:

1. Load reference data:
```
GET /api/v1/reference/all
```

**Response**:
```json
{
  "naics_codes": [
    { "code": "541511", "title": "Custom Computer Programming Services" }
  ],
  "naics_categories": { "IT": ["541511", "541512"] },
  "set_asides": [
    { "code": "SBA", "name": "Small Business" },
    { "code": "8A", "name": "8(a) Business Development" }
  ],
  "legal_structures": ["LLC", "Corporation", "S-Corp"],
  "contract_ranges": [
    { "label": "$0 - $150K", "min": 0, "max": 150000 }
  ],
  "states": [
    { "code": "DC", "name": "District of Columbia" }
  ]
}
```

2. Create company:
```
POST /api/v1/company/
```

**Request**:
```json
{
  "name": "Acme Corp",
  "legal_structure": "LLC",
  "address_street": "123 Main St",
  "address_city": "Washington",
  "address_state": "DC",
  "address_zip": "20001",
  "uei": "ABC123DEF456",
  "naics_codes": ["541511", "541512"],
  "set_asides": ["SBA", "8A"],
  "capabilities": "We specialize in...",
  "contract_value_min": 50000,
  "contract_value_max": 500000,
  "geographic_preferences": ["DC", "VA", "MD"]
}
```

**Response**:
```json
{
  "id": "company-uuid",
  "name": "Acme Corp",
  "legal_structure": "LLC",
  "naics_codes": ["541511", "541512"],
  "set_asides": ["SBA", "8A"],
  "capabilities": "We specialize in...",
  "contract_value_min": 50000,
  "contract_value_max": 500000,
  "geographic_preferences": ["DC", "VA", "MD"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## Company Profile Module

### UI Page

#### Settings Page (`/settings`)
**File**: `frontend/app/(dashboard)/settings/page.tsx`

**Tabs**:
1. **Profile** - Company information
2. **Documents** - Upload capability statements
3. **Certifications** - Certification tracking
4. **Past Performance** - Contract history
5. **Notifications** - Email preferences
6. **AI Settings** - Rescoring options

### Company Profile API

#### Get Company
```
GET /api/v1/company/me
Authorization: Bearer {token}
```

**Response**: Same as create company response

#### Update Company
```
PUT /api/v1/company/
Authorization: Bearer {token}
```

**Request**: Partial company object (only changed fields)

**Response**: Updated company object

#### Delete Company
```
DELETE /api/v1/company/
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Company profile deleted successfully"
}
```

### Notification Preferences

**Email Frequency Options**:
- `realtime` - Immediate notifications
- `daily` - Daily digest at 8 AM (recommended)
- `weekly` - Weekly summary on Mondays
- `none` - No emails

```
PUT /api/v1/auth/me
Authorization: Bearer {token}
```

**Request**:
```json
{
  "email_frequency": "daily"
}
```

---

## Opportunities Module

### UI Pages

#### 1. Opportunities List (`/opportunities`)
**File**: `frontend/app/(dashboard)/opportunities/page.tsx`

**Functionality**:
- List all AI-evaluated opportunities
- Filter by Live vs Forecast opportunities
- Stats cards (total, BID recommendations, avg scores)
- Clickable cards to view details

**API Interactions**:

1. Get evaluations:
```
GET /api/v1/evaluations?skip=0&limit=20&is_forecast=false
Authorization: Bearer {token}
```

**Query Parameters**:
- `skip` - Pagination offset
- `limit` - Items per page (max 100)
- `recommendation` - Filter: `BID`, `NO_BID`, `RESEARCH`
- `min_fit_score` - Minimum fit score filter
- `is_forecast` - `true` for forecast, `false` for live

**Response**:
```json
{
  "evaluations": [
    {
      "id": "eval-uuid",
      "opportunity_id": "opp-uuid",
      "company_id": "company-uuid",
      "fit_score": 85,
      "win_probability": 70,
      "recommendation": "BID",
      "strengths": ["Strong NAICS match", "Good past performance"],
      "weaknesses": ["Tight timeline"],
      "reasoning": "This opportunity aligns well...",
      "user_saved": null,
      "user_notes": "",
      "created_at": "2024-01-01T00:00:00Z",
      "opportunity": {
        "id": "opp-uuid",
        "notice_id": "SAM123456",
        "title": "IT Services Contract",
        "description": "Looking for...",
        "department": "Department of Defense",
        "naics_code": "541511",
        "contract_value": 500000,
        "posted_date": "2024-01-01",
        "response_deadline": "2024-02-01",
        "is_forecast": false,
        "source": "sam.gov"
      }
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 20
}
```

2. Get stats:
```
GET /api/v1/stats
Authorization: Bearer {token}
```

**Response**:
```json
{
  "total_opportunities": 150,
  "active_opportunities": 100,
  "total_evaluations": 75,
  "bid_recommendations": 25,
  "no_bid_recommendations": 30,
  "research_recommendations": 20,
  "avg_fit_score": 65.5,
  "avg_win_probability": 45.2
}
```

#### 2. Opportunity Detail (`/opportunities/[id]`)
**File**: `frontend/app/(dashboard)/opportunities/[id]/page.tsx`

**Functionality**:
- Full opportunity details
- AI evaluation scores and recommendation
- Stale evaluation warning banner
- Pipeline status selector
- User notes
- Recommended contacts
- Link to source (SAM.gov)

**API Interactions**:

1. Get opportunity:
```
GET /api/v1/opportunities/opportunities/{opportunity_id}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "id": "opp-uuid",
  "notice_id": "SAM123456",
  "title": "IT Services Contract",
  "description": "Full description...",
  "department": "Department of Defense",
  "issuing_agency": "U.S. Army",
  "naics_code": "541511",
  "contract_value": 500000,
  "posted_date": "2024-01-01T00:00:00Z",
  "response_deadline": "2024-02-01T00:00:00Z",
  "primary_contact_name": "John Smith",
  "primary_contact_email": "john.smith@gov.mil",
  "primary_contact_phone": "202-555-0100",
  "link": "https://sam.gov/...",
  "is_forecast": false,
  "source": "sam.gov",
  "evaluation": {
    "id": "eval-uuid",
    "fit_score": 85,
    "win_probability": 70,
    "recommendation": "BID",
    "strengths": ["Strong NAICS match"],
    "weaknesses": ["Tight timeline"],
    "reasoning": "Analysis...",
    "user_saved": "WATCHING",
    "user_notes": "Follow up next week",
    "is_stale": false
  }
}
```

2. Update evaluation (pipeline status):
```
PUT /api/v1/evaluations/{evaluation_id}
Authorization: Bearer {token}
```

**Request**:
```json
{
  "user_saved": "BIDDING",
  "user_notes": "Updated notes..."
}
```

**Pipeline Status Values**:
- `null` - Not saved
- `WATCHING` - Monitoring
- `BIDDING` - Actively bidding
- `PASSED` - Decided not to bid
- `WON` - Won the contract
- `LOST` - Lost the bid

3. Get opportunity contacts:
```
GET /api/v1/opportunities/{opportunity_id}/contacts
Authorization: Bearer {token}
```

**Response**:
```json
{
  "contracting_officer": {
    "first_name": "John",
    "last_name": "Smith",
    "title": "Contracting Officer",
    "email": "john.smith@gov.mil",
    "phone": "202-555-0100"
  },
  "osdbu_contact": {
    "first_name": "Jane",
    "last_name": "Doe",
    "title": "Small Business Liaison",
    "email": "jane.doe@gov.mil"
  },
  "industry_liaison": null,
  "agency": {
    "id": "agency-uuid",
    "name": "U.S. Army",
    "abbreviation": "Army",
    "small_business_url": "https://..."
  }
}
```

### Manual Discovery

```
POST /api/v1/actions/trigger-discovery?force_refresh=false
Authorization: Bearer {token}
```

**Query Parameters**:
- `force_refresh` - Bypass 15-minute cache if `true`

**Response**:
```json
{
  "message": "Discovery completed successfully",
  "discovered": 10,
  "evaluated": 5,
  "from_cache": false,
  "cache_info": "Data fetched from SAM.gov"
}
```

---

## Pipeline Management Module

### UI Page

#### Pipeline Page (`/pipeline`)
**File**: `frontend/app/(dashboard)/pipeline/page.tsx`

**Functionality**:
- Kanban board with 4 columns: WATCHING, BIDDING, WON, LOST
- Stats cards showing counts per status
- Quick status change buttons
- Deadline warnings (soon/passed)
- Click to view opportunity details
- Remove from pipeline option

**API Interactions**:

1. Get pipeline items:
```
GET /api/v1/evaluations?limit=100
Authorization: Bearer {token}
```
Then filter client-side for `user_saved !== null`

2. Update status:
```
PUT /api/v1/evaluations/{evaluation_id}
Authorization: Bearer {token}
```

**Request**:
```json
{
  "user_saved": "WON"
}
```

3. Remove from pipeline:
```
PUT /api/v1/evaluations/{evaluation_id}
Authorization: Bearer {token}
```

**Request**:
```json
{
  "user_saved": null
}
```

### Pipeline Statistics

```
GET /api/v1/pipeline/stats
Authorization: Bearer {token}
```

**Response**:
```json
{
  "total": 15,
  "watching": 5,
  "bidding": 4,
  "passed": 2,
  "won": 3,
  "lost": 1,
  "win_rate": 75.0
}
```

---

## Analytics Module

### UI Page

#### Analytics Page (`/analytics`)
**File**: `frontend/app/(dashboard)/analytics/page.tsx`

**Functionality**:
- Award statistics from USA Spending data
- Top awarding agencies
- Top vendors
- Total/average award values

**API Interaction**:

```
GET /api/v1/awards/stats
Authorization: Bearer {token}
```

**Response**:
```json
{
  "total_awards": 1500,
  "total_award_value": 50000000.00,
  "avg_award_value": 33333.33,
  "top_agencies": [
    { "agency": "Department of Defense", "count": 500 },
    { "agency": "Department of Health", "count": 300 }
  ],
  "top_vendors": [
    { "vendor": "Acme Corp", "count": 50 },
    { "vendor": "Tech Solutions", "count": 45 }
  ],
  "naics_breakdown": [
    { "naics": "541511", "count": 200 },
    { "naics": "541512", "count": 150 }
  ]
}
```

---

## Agency Matching Module

### UI Pages

#### 1. Agencies List (`/agencies`)
**File**: `frontend/app/(dashboard)/agencies/page.tsx`

**Functionality**:
- Two tabs: "Recommended for You" and "All Agencies"
- Match score badges
- Opportunity counts
- Search filter for all agencies

**API Interactions**:

1. Get recommended agencies:
```
GET /api/v1/agencies/recommended?limit=20
Authorization: Bearer {token}
```

**Response**:
```json
{
  "agencies": [
    {
      "id": "agency-uuid",
      "name": "Department of Defense",
      "abbreviation": "DoD",
      "level": "department",
      "match_score": 85,
      "match_reason": "Strong NAICS alignment",
      "opportunity_count": 150,
      "avg_contract_value": 500000
    }
  ],
  "total": 10
}
```

2. Get all agencies:
```
GET /api/v1/agencies/?skip=0&limit=100
```

**Response**:
```json
{
  "agencies": [
    {
      "id": "agency-uuid",
      "name": "Department of Defense",
      "abbreviation": "DoD",
      "level": "department",
      "opportunity_count": 150,
      "avg_contract_value": 500000
    }
  ],
  "total": 50
}
```

#### 2. Agency Detail (`/agencies/[id]`)
**File**: `frontend/app/(dashboard)/agencies/[id]/page.tsx`

**Functionality**:
- Agency details and statistics
- Match score breakdown (NAICS, set-aside, geographic, award history)
- Small business goals (8(a), WOSB, SDVOSB, HUBZone percentages)
- Key contacts (OSDBU, industry liaison)
- Quick links (opportunities, small business page, forecast, vendor portal)

**API Interactions**:

1. Get agency details:
```
GET /api/v1/agencies/{agency_id}
```

**Response**:
```json
{
  "id": "agency-uuid",
  "name": "Department of Defense",
  "abbreviation": "DoD",
  "level": "department",
  "small_business_goal_pct": 23.0,
  "eight_a_goal_pct": 5.0,
  "wosb_goal_pct": 5.0,
  "sdvosb_goal_pct": 3.0,
  "hubzone_goal_pct": 3.0,
  "small_business_url": "https://...",
  "forecast_url": "https://...",
  "vendor_portal_url": "https://...",
  "opportunity_count": 150,
  "avg_contract_value": 500000,
  "top_naics_codes": ["541511", "541512"],
  "contacts": [
    {
      "id": "contact-uuid",
      "first_name": "Jane",
      "last_name": "Doe",
      "title": "OSDBU Director",
      "email": "jane.doe@gov.mil",
      "phone": "202-555-0100",
      "contact_type": "osdbu"
    }
  ]
}
```

2. Get match score breakdown:
```
GET /api/v1/agencies/{agency_id}/match
Authorization: Bearer {token}
```

**Response**:
```json
{
  "agency_id": "agency-uuid",
  "agency_name": "Department of Defense",
  "score": 85,
  "factors": {
    "naics_alignment": 90,
    "set_aside_alignment": 80,
    "geographic_fit": 85,
    "award_history_fit": 75
  },
  "reasoning": "Your company has strong alignment..."
}
```

3. Get agency contacts:
```
GET /api/v1/agencies/{agency_id}/contacts
```

---

## Document Management Module

### UI Components

Located in `frontend/components/documents/`:
- `DocumentUpload.tsx` - File upload with progress
- `DocumentList.tsx` - List uploaded documents
- `DocumentSuggestions.tsx` - Review AI-extracted suggestions
- `CertificationForm.tsx` - Manage certifications
- `PastPerformanceForm.tsx` - Manage past performance records

### Document Upload Flow

1. **Get Upload URL**:
```
POST /api/v1/documents/upload
Authorization: Bearer {token}
```

**Request**:
```json
{
  "file_name": "capability_statement.pdf",
  "file_type": "application/pdf",
  "document_type": "capability_statement",
  "file_size": 1048576
}
```

**Response**:
```json
{
  "upload_url": "https://s3.amazonaws.com/...",
  "s3_key": "companies/{company_id}/documents/{uuid}.pdf",
  "expires_in": 900
}
```

2. **Upload to S3** (direct PUT to presigned URL)

3. **Create Document Record**:
```
POST /api/v1/documents/
Authorization: Bearer {token}
```

**Request**:
```json
{
  "document_type": "capability_statement",
  "file_name": "capability_statement.pdf",
  "file_type": "application/pdf",
  "file_size": 1048576,
  "s3_key": "companies/{company_id}/documents/{uuid}.pdf"
}
```

**Response**:
```json
{
  "id": "doc-uuid",
  "company_id": "company-uuid",
  "document_type": "capability_statement",
  "file_name": "capability_statement.pdf",
  "file_type": "application/pdf",
  "file_size": 1048576,
  "s3_key": "...",
  "extraction_status": "pending",
  "is_scanned": false,
  "ocr_confidence": null,
  "suggestions_reviewed": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Document Types

- `capability_statement` - Company capability statements
- `certification` - Certification documents
- `past_performance` - Past performance records
- `other` - Other documents

### Document Suggestions (AI Extraction)

```
GET /api/v1/documents/{document_id}/suggestions
Authorization: Bearer {token}
```

**Response**:
```json
{
  "document_id": "doc-uuid",
  "extraction_status": "completed",
  "ocr_confidence": 0.95,
  "ocr_quality": "good",
  "is_scanned": false,
  "suggestions_reviewed": false,
  "naics_codes": [
    { "code": "541511", "description": "Custom Programming", "confidence": 0.9 }
  ],
  "certifications": [
    { "certification_type": "8A", "expiration_date": "2025-01-01", "confidence": 0.85 }
  ],
  "capabilities": "Extracted capabilities text...",
  "agencies": ["Department of Defense", "NASA"],
  "locations": ["Washington, DC", "Virginia"],
  "contract_values": ["$500K", "$1M"],
  "raw_entities": {}
}
```

### Apply Suggestions

```
POST /api/v1/documents/{document_id}/apply-suggestions
Authorization: Bearer {token}
```

**Request**:
```json
{
  "naics_codes": ["541511"],
  "certifications": ["8A"],
  "capabilities": "New capabilities text",
  "append_capabilities": true,
  "geographic_preferences": ["DC", "VA"]
}
```

**Response**:
```json
{
  "naics_codes_added": 1,
  "certifications_created": 1,
  "capabilities_updated": true,
  "geographic_preferences_added": 2,
  "profile_version": 2,
  "message": "Applied suggestions: 1 NAICS codes, 1 certifications, 2 locations"
}
```

### Certifications API

```
POST /api/v1/documents/certifications/
GET /api/v1/documents/certifications/
GET /api/v1/documents/certifications/{cert_id}
PUT /api/v1/documents/certifications/{cert_id}
DELETE /api/v1/documents/certifications/{cert_id}
```

**Create Request**:
```json
{
  "certification_type": "8A",
  "document_id": "doc-uuid",
  "issued_date": "2020-01-01",
  "expiration_date": "2025-01-01"
}
```

**Response includes computed fields**:
```json
{
  "id": "cert-uuid",
  "certification_type": "8A",
  "expiration_date": "2025-01-01",
  "status": "active",
  "is_expiring_soon": true,
  "days_until_expiration": 45
}
```

### Past Performance API

```
POST /api/v1/documents/past-performance/
GET /api/v1/documents/past-performance/
GET /api/v1/documents/past-performance/{record_id}
PUT /api/v1/documents/past-performance/{record_id}
DELETE /api/v1/documents/past-performance/{record_id}
```

**Create Request**:
```json
{
  "contract_number": "W91234-20-C-0001",
  "agency_name": "U.S. Army",
  "contract_value": 500000,
  "pop_start": "2020-01-01",
  "pop_end": "2023-01-01",
  "naics_codes": ["541511"],
  "performance_rating": "Exceptional",
  "description": "Provided IT services..."
}
```

---

## AI Evaluation & Rescoring Module

### Stale Evaluation Detection

When company profile is updated, profile_version increments. Evaluations with older profile_version are marked as "stale".

**Check Stale Count**:
```
GET /api/v1/evaluations/stale-count
Authorization: Bearer {token}
```

**Response**:
```json
{
  "stale_count": 15,
  "current_profile_version": 3
}
```

### Bulk Rescore

```
POST /api/v1/evaluations/rescore-all
Authorization: Bearer {token}
```

**Response**:
```json
{
  "rescored": 15,
  "errors": 0,
  "total": 15,
  "message": "Successfully rescored 15 evaluations"
}
```

### Single Evaluation Refresh

```
POST /api/v1/evaluations/{evaluation_id}/refresh
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Evaluation refreshed successfully"
}
```

### Get Profile Version

```
GET /api/v1/company/profile-version
Authorization: Bearer {token}
```

**Response**:
```json
{
  "profile_version": 3
}
```

---

## Email & Notifications Module

### Email Frequencies

| Frequency | Description | Timing |
|-----------|-------------|--------|
| `realtime` | Immediate on new BID recommendations | As discovered |
| `daily` | Daily digest | 8:00 AM local |
| `weekly` | Weekly summary | Monday morning |
| `none` | No emails | - |

### Unsubscribe

#### One-Click Unsubscribe Page (`/unsubscribe`)
**File**: `frontend/app/unsubscribe/page.tsx`

**Functionality**:
- Token-based unsubscribe (no login required)
- Auto-unsubscribes on page load
- Confirmation message

**API Interaction**:
```
GET /api/v1/auth/unsubscribe/{token}
```

**Response**:
```json
{
  "message": "Successfully unsubscribed from emails"
}
```

### Cron Jobs (Backend Scripts)

| Script | Schedule | Description |
|--------|----------|-------------|
| `discover_opportunities.py` | Every 15 min | Fetch from SAM.gov |
| `evaluate_pending.py` | After discovery | AI evaluation |
| `send_daily_digest.py` | 8:00 AM | Daily email digest |
| `send_deadline_reminders.py` | Daily | Upcoming deadline alerts |
| `cleanup_opportunities.py` | Weekly | Remove old opportunities |

---

## Reference Data Module

### API Endpoints

All reference endpoints are public (no auth required):

```
GET /api/v1/reference/naics                 - NAICS codes
GET /api/v1/reference/naics?search=computer - Search NAICS
GET /api/v1/reference/naics/categories      - NAICS categories
GET /api/v1/reference/set-asides            - Set-aside types
GET /api/v1/reference/legal-structures      - Legal structures
GET /api/v1/reference/contract-ranges       - Contract value ranges
GET /api/v1/reference/states                - US states/territories
GET /api/v1/reference/all                   - All reference data
```

### Set-Aside Types

| Code | Name |
|------|------|
| `SBA` | Small Business |
| `SBP` | Small Business Set-Aside (Total) |
| `8A` | 8(a) Business Development |
| `8AN` | 8(a) Sole Source |
| `HZC` | HUBZone |
| `HZS` | HUBZone Sole Source |
| `SDVOSBC` | Service-Disabled Veteran-Owned |
| `SDVOSBS` | SDVOSB Sole Source |
| `WOSB` | Women-Owned Small Business |
| `EDWOSB` | Economically Disadvantaged WOSB |
| `VSA` | Veteran-Owned Small Business |

### Contract Value Ranges

| Label | Min | Max |
|-------|-----|-----|
| $0 - $150K | 0 | 150,000 |
| $150K - $500K | 150,000 | 500,000 |
| $500K - $1M | 500,000 | 1,000,000 |
| $1M - $5M | 1,000,000 | 5,000,000 |
| $5M - $10M | 5,000,000 | 10,000,000 |
| $10M+ | 10,000,000 | null |

---

## API Endpoint Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/logout` | Yes | Logout |
| POST | `/api/v1/auth/verify-email` | No | Verify email |
| POST | `/api/v1/auth/forgot-password` | No | Request password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| PUT | `/api/v1/auth/me` | Yes | Update user settings |
| GET | `/api/v1/auth/unsubscribe/{token}` | No | Unsubscribe from emails |

### Company Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/company/me` | Yes | Get company profile |
| POST | `/api/v1/company/` | Yes | Create company |
| PUT | `/api/v1/company/` | Yes | Update company |
| DELETE | `/api/v1/company/` | Yes | Delete company |

### Opportunity Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/opportunities/` | No | List opportunities |
| GET | `/api/v1/opportunities/opportunities/{id}` | Yes | Get opportunity |
| GET | `/api/v1/opportunities/{id}/contacts` | Yes | Get contacts |
| GET | `/api/v1/opportunities/{id}/match-score` | Yes | Get match score |
| POST | `/api/v1/opportunities/{id}/evaluate` | Yes | Lazy evaluate |
| GET | `/api/v1/evaluations` | Yes | List evaluations |
| GET | `/api/v1/evaluations/{id}` | Yes | Get evaluation |
| PUT | `/api/v1/evaluations/{id}` | Yes | Update evaluation |
| GET | `/api/v1/stats` | Yes | Get statistics |
| GET | `/api/v1/pipeline` | Yes | List pipeline items |
| GET | `/api/v1/pipeline/stats` | Yes | Pipeline statistics |
| POST | `/api/v1/actions/trigger-discovery` | Yes | Trigger discovery |

### Evaluation/Rescoring Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/evaluations/stale-count` | Yes | Get stale count |
| POST | `/api/v1/evaluations/rescore-all` | Yes | Rescore all |
| GET | `/api/v1/evaluations/{id}/stale-info` | Yes | Check if stale |
| POST | `/api/v1/evaluations/{id}/refresh` | Yes | Refresh single |
| GET | `/api/v1/evaluations/profile-version` | Yes | Get profile version |

### Agency Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/agencies/` | No | List agencies |
| GET | `/api/v1/agencies/recommended` | Yes | Get recommendations |
| GET | `/api/v1/agencies/{id}` | No | Get agency details |
| GET | `/api/v1/agencies/{id}/contacts` | No | Get agency contacts |
| GET | `/api/v1/agencies/{id}/match` | Yes | Get match breakdown |
| GET | `/api/v1/agencies/contacts/` | No | List all contacts |
| GET | `/api/v1/agencies/contacts/{id}` | No | Get contact |

### Document Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/documents/upload` | Yes | Get upload URL |
| POST | `/api/v1/documents/` | Yes | Create document |
| GET | `/api/v1/documents/` | Yes | List documents |
| GET | `/api/v1/documents/{id}` | Yes | Get document |
| GET | `/api/v1/documents/{id}/download` | Yes | Get download URL |
| DELETE | `/api/v1/documents/{id}` | Yes | Delete document |
| GET | `/api/v1/documents/{id}/versions` | Yes | List versions |
| POST | `/api/v1/documents/{id}/versions/{v}/restore` | Yes | Restore version |
| GET | `/api/v1/documents/{id}/suggestions` | Yes | Get suggestions |
| POST | `/api/v1/documents/{id}/apply-suggestions` | Yes | Apply suggestions |
| POST | `/api/v1/documents/{id}/mark-reviewed` | Yes | Mark reviewed |

### Certification Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/documents/certifications/` | Yes | Create cert |
| GET | `/api/v1/documents/certifications/` | Yes | List certs |
| GET | `/api/v1/documents/certifications/{id}` | Yes | Get cert |
| PUT | `/api/v1/documents/certifications/{id}` | Yes | Update cert |
| DELETE | `/api/v1/documents/certifications/{id}` | Yes | Delete cert |

### Past Performance Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/documents/past-performance/` | Yes | Create record |
| GET | `/api/v1/documents/past-performance/` | Yes | List records |
| GET | `/api/v1/documents/past-performance/{id}` | Yes | Get record |
| PUT | `/api/v1/documents/past-performance/{id}` | Yes | Update record |
| DELETE | `/api/v1/documents/past-performance/{id}` | Yes | Delete record |

### Awards Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/awards/` | No | List awards |
| GET | `/api/v1/awards/stats` | No | Award statistics |

### Reference Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/reference/all` | No | All reference data |
| GET | `/api/v1/reference/naics` | No | NAICS codes |
| GET | `/api/v1/reference/naics/categories` | No | NAICS categories |
| GET | `/api/v1/reference/set-asides` | No | Set-aside types |
| GET | `/api/v1/reference/legal-structures` | No | Legal structures |
| GET | `/api/v1/reference/contract-ranges` | No | Contract ranges |
| GET | `/api/v1/reference/states` | No | US states |

---

## Production URLs

| Service | URL |
|---------|-----|
| Frontend (CloudFront) | https://d246k2epie5kxs.cloudfront.net |
| Backend API (CloudFront) | https://d1ntjd1d3nmhbf.cloudfront.net |
| Backend API (Direct EC2) | http://ec2-35-173-103-83.compute-1.amazonaws.com:8000 |

### Demo Credentials

- **Email:** `testuser@techgov.com`
- **Password:** `Test123!@#`

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error message here"
}
```

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/register` | 5/minute |
| `/api/v1/auth/login` | 10/minute |
| `/api/v1/auth/forgot-password` | 3/minute |

---

*Generated: 2024*
*Version: 1.0.0*
