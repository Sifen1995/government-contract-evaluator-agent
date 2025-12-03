# GovAI API Documentation

Complete REST API reference for the GovAI platform.

## Base URL

```
Production: https://api.govai.com
Development: http://localhost:8000
```

## Authentication

All API endpoints (except registration and login) require JWT authentication.

### Obtaining a Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Using the Token

Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints

### [Authentication](./authentication.md)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email address

### [User Management](./user.md)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/preferences` - Update notification preferences

### [Company Profile](./company.md)
- `GET /api/company` - Get company profile
- `POST /api/company` - Create company profile
- `PUT /api/company` - Update company profile

### [Opportunities](./opportunities.md)
- `GET /api/opportunities` - List opportunities (with filtering, sorting, pagination)
- `GET /api/opportunities/:id` - Get opportunity details with AI evaluation
- `POST /api/opportunities/:id/save` - Save opportunity to pipeline
- `DELETE /api/opportunities/:id/save` - Remove from pipeline
- `POST /api/opportunities/:id/dismiss` - Dismiss opportunity
- `PUT /api/opportunities/:id/status` - Update opportunity status
- `POST /api/opportunities/:id/notes` - Add note to opportunity

### [Pipeline](./pipeline.md)
- `GET /api/pipeline` - Get pipeline opportunities
- `GET /api/pipeline/stats` - Get pipeline statistics
- `GET /api/pipeline/deadlines` - Get upcoming deadlines

## Common Patterns

### Pagination

List endpoints support pagination:

```http
GET /api/opportunities?page=1&page_size=20
```

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "pages": 8
}
```

### Filtering

Use query parameters for filtering:

```http
GET /api/opportunities?naics_code=541512&set_aside_type=SBA&min_fit_score=80
```

### Sorting

Use `sort_by` and `sort_order` parameters:

```http
GET /api/opportunities?sort_by=fit_score&sort_order=desc
```

### Error Handling

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Email already registered"]
    }
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Rate Limiting

- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1640995200
```

## Webhooks (Coming Soon)

Subscribe to real-time events:
- `opportunity.discovered` - New opportunity matched
- `opportunity.deadline_warning` - Deadline approaching
- `pipeline.status_changed` - Opportunity status updated

## SDKs

Official SDKs:
- **JavaScript/TypeScript**: `npm install @govai/sdk`
- **Python**: `pip install govai-sdk`
- **Ruby**: `gem install govai`

Example usage:

```javascript
import { GovAI } from '@govai/sdk';

const client = new GovAI({
  apiKey: 'your-api-key'
});

const opportunities = await client.opportunities.list({
  fit_score_min: 80,
  page_size: 10
});
```

## Interactive API Explorer

Try the API in your browser:
- [Swagger/OpenAPI Docs](http://localhost:8000/docs)
- [ReDoc Documentation](http://localhost:8000/redoc)

## Support

- **Documentation**: https://docs.govai.com
- **API Status**: https://status.govai.com
- **Support Email**: api-support@govai.com
- **GitHub Issues**: https://github.com/govai/api/issues
