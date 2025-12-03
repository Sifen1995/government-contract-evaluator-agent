# Opportunities API

API endpoints for discovering and managing government contract opportunities.

## List Opportunities

Get a paginated list of opportunities matched to your company profile.

```http
GET /api/opportunities
```

### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number (1-indexed) | 1 |
| `page_size` | integer | Items per page (1-100) | 20 |
| `sort_by` | string | Sort field: `fit_score`, `posted_date`, `response_deadline`, `contract_value` | `fit_score` |
| `sort_order` | string | `asc` or `desc` | `desc` |
| `min_fit_score` | integer | Minimum fit score (0-100) | 0 |
| `max_fit_score` | integer | Maximum fit score (0-100) | 100 |
| `naics_code` | string | Filter by NAICS code | - |
| `set_aside_type` | string | Filter by set-aside: `SBA`, `8A`, `WOSB`, `HUBZone`, etc. | - |
| `agency` | string | Filter by agency name | - |
| `min_value` | integer | Minimum contract value | - |
| `max_value` | integer | Maximum contract value | - |
| `deadline_from` | date | Response deadline from (ISO 8601) | - |
| `deadline_to` | date | Response deadline to (ISO 8601) | - |
| `status` | string | Filter by status: `new`, `saved`, `dismissed` | - |
| `recommendation` | string | Filter by AI recommendation: `BID`, `NO_BID`, `REVIEW` | - |

### Request Example

```http
GET /api/opportunities?min_fit_score=80&sort_by=fit_score&sort_order=desc&page=1&page_size=10
Authorization: Bearer eyJhbGc...
```

### Response

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "notice_id": "bc6b43f57abf4c7c90a5e3fb3c549745",
      "title": "DoD Enterprise IT Modernization",
      "solicitation_number": "HQ0034-25-R-0045",
      "agency": "Department of Defense",
      "department": "Defense Information Systems Agency",
      "office": "DISA Field Office",
      "naics_code": "541512",
      "set_aside_type": "8A",
      "posted_date": "2025-12-03T08:00:00Z",
      "response_deadline": "2026-01-15T14:00:00Z",
      "contract_value_min": 10000000,
      "contract_value_max": 20000000,
      "description": "Enterprise-wide IT modernization including cloud migration...",
      "evaluation": {
        "fit_score": 92,
        "win_probability": 75,
        "recommendation": "BID",
        "confidence": 85,
        "evaluated_at": "2025-12-03T09:30:00Z"
      },
      "pipeline_status": null,
      "is_saved": false,
      "is_dismissed": false,
      "created_at": "2025-12-03T09:00:00Z",
      "updated_at": "2025-12-03T09:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 10,
  "pages": 15
}
```

---

## Get Opportunity Details

Get detailed information about a specific opportunity including full AI evaluation.

```http
GET /api/opportunities/:id
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Opportunity ID |

### Request Example

```http
GET /api/opportunities/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "notice_id": "bc6b43f57abf4c7c90a5e3fb3c549745",
  "title": "DoD Enterprise IT Modernization",
  "solicitation_number": "HQ0034-25-R-0045",
  "agency": "Department of Defense",
  "department": "Defense Information Systems Agency",
  "office": "DISA Field Office",
  "naics_code": "541512",
  "set_aside_type": "8A",
  "set_aside_description": "8(a) Small Business Program",
  "posted_date": "2025-12-03T08:00:00Z",
  "response_deadline": "2026-01-15T14:00:00Z",
  "contract_value_min": 10000000,
  "contract_value_max": 20000000,
  "description": "Enterprise-wide IT modernization including cloud migration, application modernization, and cybersecurity enhancements for DoD networks.",
  "place_of_performance": {
    "city": "Arlington",
    "state": "VA",
    "zip": "22201"
  },
  "point_of_contact": {
    "name": "Jane Smith",
    "email": "jane.smith@disa.mil",
    "phone": "555-123-4567"
  },
  "links": {
    "sam_gov_url": "https://sam.gov/opp/bc6b43f57abf4c7c90a5e3fb3c549745",
    "rfp_url": "https://sam.gov/api/prod/opportunities/v1/noticedesc?noticeid=bc6b43f57abf4c7c90a5e3fb3c549745"
  },
  "evaluation": {
    "fit_score": 92,
    "win_probability": 75,
    "recommendation": "BID",
    "confidence": 85,
    "strengths": [
      "Exact NAICS code match (541512)",
      "8(a) eligibility aligns with set-aside",
      "Contract value within company range",
      "Strong DoD past performance",
      "Virginia location preference met"
    ],
    "weaknesses": [
      "Limited experience with enterprise-scale migrations",
      "Tight timeline may stress resources"
    ],
    "key_considerations": [
      "Ensure team has active clearances",
      "Review subcontracting requirements",
      "Assess capacity for 18-month performance period"
    ],
    "executive_summary": "TechDefense Solutions is an excellent match for this opportunity. Your 8(a) status, NAICS alignment, and DoD experience position you strongly. Main considerations are ensuring adequate clearances and capacity for the timeline.",
    "evaluated_at": "2025-12-03T09:30:00Z"
  },
  "pipeline_status": "pursuing",
  "is_saved": true,
  "is_dismissed": false,
  "notes": [
    {
      "id": "note-123",
      "content": "Spoke with COR, emphasized innovation approach",
      "created_by": "Jennifer Lee",
      "created_at": "2025-12-04T10:00:00Z"
    }
  ],
  "created_at": "2025-12-03T09:00:00Z",
  "updated_at": "2025-12-04T10:00:00Z"
}
```

---

## Save to Pipeline

Save an opportunity to your pipeline with a specific status.

```http
POST /api/opportunities/:id/save
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Opportunity ID |

### Request Body

```json
{
  "status": "pursuing"
}
```

**Status Options:**
- `watching` - Monitoring for now
- `pursuing` - Actively pursuing
- `preparing` - Preparing proposal
- `submitted` - Proposal submitted
- `won` - Contract awarded
- `lost` - Not awarded

### Request Example

```http
POST /api/opportunities/550e8400-e29b-41d4-a716-446655440000/save
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "status": "pursuing"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pipeline_status": "pursuing",
  "is_saved": true,
  "saved_at": "2025-12-04T11:00:00Z"
}
```

---

## Update Pipeline Status

Update the status of an opportunity in your pipeline.

```http
PUT /api/opportunities/:id/status
```

### Request Body

```json
{
  "status": "preparing"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pipeline_status": "preparing",
  "updated_at": "2025-12-05T14:00:00Z"
}
```

---

## Remove from Pipeline

Remove an opportunity from your pipeline.

```http
DELETE /api/opportunities/:id/save
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "pipeline_status": null,
  "is_saved": false,
  "removed_at": "2025-12-04T12:00:00Z"
}
```

---

## Dismiss Opportunity

Mark an opportunity as dismissed (not interested).

```http
POST /api/opportunities/:id/dismiss
```

### Request Body (Optional)

```json
{
  "reason": "Contract value too small"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "is_dismissed": true,
  "dismissed_at": "2025-12-04T13:00:00Z"
}
```

---

## Add Note

Add a note to an opportunity.

```http
POST /api/opportunities/:id/notes
```

### Request Body

```json
{
  "content": "Spoke with contracting officer about technical requirements"
}
```

### Response

```json
{
  "id": "note-124",
  "opportunity_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Spoke with contracting officer about technical requirements",
  "created_by": "John Doe",
  "created_at": "2025-12-04T15:00:00Z"
}
```

---

## Error Responses

### Opportunity Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Opportunity not found",
    "details": {
      "opportunity_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Status Code:** 404

### Invalid Status

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid pipeline status",
    "details": {
      "status": ["Must be one of: watching, pursuing, preparing, submitted, won, lost"]
    }
  }
}
```

**Status Code:** 422

---

## Webhooks

Subscribe to opportunity events:

### `opportunity.discovered`

Triggered when a new opportunity is discovered and matched to your profile.

```json
{
  "event": "opportunity.discovered",
  "timestamp": "2025-12-04T10:00:00Z",
  "data": {
    "opportunity_id": "550e8400-e29b-41d4-a716-446655440000",
    "fit_score": 92,
    "recommendation": "BID"
  }
}
```

### `opportunity.deadline_warning`

Triggered when a response deadline is approaching.

```json
{
  "event": "opportunity.deadline_warning",
  "timestamp": "2025-12-08T08:00:00Z",
  "data": {
    "opportunity_id": "550e8400-e29b-41d4-a716-446655440000",
    "days_remaining": 7,
    "response_deadline": "2026-01-15T14:00:00Z"
  }
}
```

---

## Best Practices

1. **Use Filters**: Filter by `min_fit_score` to focus on high-quality opportunities
2. **Sort Wisely**: Sort by `fit_score` desc to see best matches first
3. **Cache Responsibly**: Opportunity data updates every 15 minutes
4. **Handle Pagination**: Large result sets require pagination
5. **Monitor Deadlines**: Use `deadline_from` and `deadline_to` to track urgent opportunities
6. **Add Notes**: Document interactions and decisions for team visibility
7. **Update Status**: Keep pipeline status current for accurate reporting
