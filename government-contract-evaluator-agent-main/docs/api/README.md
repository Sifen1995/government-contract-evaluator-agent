# GovAI API Documentation

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://api.yourdomain.com`

## Interactive Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`

## Authentication

All protected endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the `/api/v1/auth/login` endpoint.

---

## Authentication Endpoints

### POST `/api/v1/auth/register`

Register a new user account.

**Rate Limit**: 5 requests/minute

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_verified": false,
  "email_frequency": "daily",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### POST `/api/v1/auth/verify-email`

Verify email address with token.

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response** (200 OK):
```json
{
  "message": "Email verified successfully"
}
```

---

### POST `/api/v1/auth/login`

Authenticate and obtain access token.

**Rate Limit**: 10 requests/minute

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": true
  }
}
```

---

### POST `/api/v1/auth/logout`

Logout current user (stateless - client should delete token).

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### POST `/api/v1/auth/forgot-password`

Request a password reset email.

**Rate Limit**: 3 requests/minute

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

---

### POST `/api/v1/auth/reset-password`

Reset password with token.

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "new_password": "newsecurepassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

---

### GET `/api/v1/auth/me`

Get current authenticated user.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_verified": true,
  "email_frequency": "daily",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### PUT `/api/v1/auth/me`

Update current user profile.

**Authentication**: Required

**Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email_frequency": "weekly"
}
```

**Response** (200 OK): Updated user object

---

## Company Endpoints

### GET `/api/v1/company/me`

Get current user's company profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "legal_structure": "LLC",
  "uei": "ABC123456789",
  "naics_codes": ["541511", "541512"],
  "set_asides": ["8a", "WOSB"],
  "capabilities_statement": "We provide IT services...",
  "min_contract_value": 50000,
  "max_contract_value": 5000000,
  "state_preferences": ["VA", "MD", "DC"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### POST `/api/v1/company/`

Create a company profile.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Acme Corp",
  "legal_structure": "LLC",
  "uei": "ABC123456789",
  "address": "123 Main St, City, ST 12345",
  "naics_codes": ["541511", "541512"],
  "set_asides": ["8a"],
  "capabilities_statement": "We provide IT services...",
  "min_contract_value": 50000,
  "max_contract_value": 5000000,
  "state_preferences": ["VA", "MD"]
}
```

**Response** (201 Created): Company object

---

### PUT `/api/v1/company/`

Update company profile.

**Authentication**: Required

**Request Body**: Same as POST (all fields optional)

**Response** (200 OK): Updated company object

---

### DELETE `/api/v1/company/`

Delete company profile.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Company profile deleted successfully"
}
```

---

## Opportunities Endpoints

### GET `/api/v1/opportunities/opportunities`

List opportunities filtered by user's NAICS codes.

**Authentication**: Required

**Query Parameters**:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page (default: 20, max: 100)
- `naics_code` (string): Filter by specific NAICS code
- `active_only` (bool): Only active opportunities (default: true)

**Response** (200 OK):
```json
{
  "opportunities": [
    {
      "id": "uuid",
      "notice_id": "SAM123456",
      "title": "IT Support Services",
      "description": "...",
      "naics_code": "541511",
      "agency": "Department of Defense",
      "office": "Army",
      "posted_date": "2024-01-01",
      "response_deadline": "2024-02-01",
      "place_of_performance": "Washington, DC",
      "set_aside_type": "8(a)",
      "contract_value": 500000,
      "is_active": true
    }
  ],
  "total": 150,
  "skip": 0,
  "limit": 20
}
```

---

### GET `/api/v1/opportunities/opportunities/{opportunity_id}`

Get a specific opportunity with evaluation.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "uuid",
  "notice_id": "SAM123456",
  "title": "IT Support Services",
  "description": "...",
  "evaluation": {
    "id": "uuid",
    "fit_score": 85,
    "win_probability": 72,
    "recommendation": "BID",
    "reasoning": "Strong alignment with company capabilities...",
    "strengths": ["Relevant NAICS code", "Set-aside eligible"],
    "weaknesses": ["No prior agency relationship"],
    "key_requirements": ["Security clearance", "5 years experience"],
    "risk_factors": ["Tight deadline", "Competitive procurement"]
  }
}
```

---

### GET `/api/v1/opportunities/evaluations`

List AI evaluations for user's company.

**Authentication**: Required

**Query Parameters**:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page (default: 20, max: 100)
- `recommendation` (string): Filter by BID, NO_BID, or RESEARCH
- `min_fit_score` (float): Minimum fit score (0-100)

**Response** (200 OK):
```json
{
  "evaluations": [
    {
      "id": "uuid",
      "fit_score": 85,
      "win_probability": 72,
      "recommendation": "BID",
      "reasoning": "...",
      "strengths": [],
      "weaknesses": [],
      "key_requirements": [],
      "risk_factors": [],
      "user_saved": "WATCHING",
      "user_notes": "Review with team",
      "opportunity": { ... }
    }
  ],
  "total": 50,
  "skip": 0,
  "limit": 20
}
```

---

### PUT `/api/v1/opportunities/evaluations/{evaluation_id}`

Update evaluation (save to pipeline, add notes).

**Authentication**: Required

**Request Body**:
```json
{
  "user_saved": "BIDDING",
  "user_notes": "Preparing proposal, due next week"
}
```

**Response** (200 OK): Updated evaluation object

---

### GET `/api/v1/opportunities/stats`

Get opportunity and evaluation statistics.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total_opportunities": 500,
  "active_opportunities": 350,
  "total_evaluations": 200,
  "bid_recommendations": 45,
  "no_bid_recommendations": 120,
  "research_recommendations": 35,
  "avg_fit_score": 62.5,
  "avg_win_probability": 48.2
}
```

---

### GET `/api/v1/opportunities/pipeline`

List opportunities in user's pipeline.

**Authentication**: Required

**Query Parameters**:
- `skip` (int): Pagination offset (default: 0)
- `limit` (int): Results per page (default: 100, max: 200)
- `status` (string): Filter by WATCHING, BIDDING, PASSED, WON, or LOST

**Response** (200 OK): Same as evaluations list

---

### GET `/api/v1/opportunities/pipeline/stats`

Get pipeline statistics.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "total": 25,
  "watching": 10,
  "bidding": 8,
  "passed": 3,
  "won": 3,
  "lost": 1,
  "win_rate": 75.0
}
```

---

### POST `/api/v1/opportunities/actions/trigger-discovery`

Manually trigger opportunity discovery.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Discovery triggered successfully",
  "task_id": "celery-task-uuid"
}
```

---

## Reference Data Endpoints

### GET `/api/v1/reference/naics`

Get NAICS codes.

**Query Parameters**:
- `search` (string): Search term

**Response** (200 OK):
```json
[
  {
    "code": "541511",
    "title": "Custom Computer Programming Services",
    "category": "Professional, Scientific, and Technical Services"
  }
]
```

---

### GET `/api/v1/reference/set-asides`

Get set-aside certification types.

**Response** (200 OK):
```json
[
  {"code": "8a", "name": "8(a) Business Development"},
  {"code": "WOSB", "name": "Women-Owned Small Business"},
  {"code": "SDVOSB", "name": "Service-Disabled Veteran-Owned Small Business"},
  {"code": "HUBZone", "name": "Historically Underutilized Business Zone"}
]
```

---

### GET `/api/v1/reference/all`

Get all reference data in one request.

**Response** (200 OK): Combined NAICS, set-asides, legal structures, contract ranges, states

---

## Health Check Endpoints

### GET `/health`

Basic health check.

**Response** (200 OK):
```json
{
  "status": "healthy"
}
```

---

### GET `/health/detailed`

Detailed health check with dependencies.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

---

### GET `/ready`

Readiness probe for load balancers.

**Response** (200 OK): Returns 200 if all dependencies are ready, 503 otherwise.

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not authorized for this resource)
- `404` - Not Found
- `422` - Unprocessable Entity (validation error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
