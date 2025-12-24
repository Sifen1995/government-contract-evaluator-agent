# GovAI Production Infrastructure

## Production URLs

| Service | URL | Protocol |
|---------|-----|----------|
| **Frontend** | https://govcontract-ai.hapotech.com | HTTPS |
| **API** | https://api.govcontract-ai.hapotech.com | HTTPS |
| API Docs (Swagger) | https://api.govcontract-ai.hapotech.com/docs | HTTPS |

## Demo Credentials

- **Email:** `testuser@techgov.com`
- **Password:** `Test123!@#`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Route 53                                    │
│  govcontract-ai.hapotech.com  →  CloudFront (E1HHOE0IVFDYXT)           │
│  api.govcontract-ai.hapotech.com  →  CloudFront (E22O410H6BO5AF)       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            CloudFront                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │ Frontend Distribution       │  │ API Distribution            │      │
│  │ ID: E1HHOE0IVFDYXT         │  │ ID: E22O410H6BO5AF          │      │
│  │ d246k2epie5kxs.cloudfront  │  │ d1ntjd1d3nmhbf.cloudfront   │      │
│  │ SSL: ACM Certificate       │  │ SSL: ACM Certificate        │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     EC2 Instance (t3a.large)                            │
│                 ec2-35-173-103-83.compute-1.amazonaws.com               │
│                          IP: 35.173.103.83                              │
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │ govai-frontend.service     │  │ govai-api.service           │      │
│  │ Port: 3005                 │  │ Port: 8000                  │      │
│  │ Next.js 14 (standalone)    │  │ FastAPI + Gunicorn          │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           AWS RDS (PostgreSQL)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## CloudFront Distributions

### Frontend Distribution
| Property | Value |
|----------|-------|
| Distribution ID | `E1HHOE0IVFDYXT` |
| CloudFront Domain | `d246k2epie5kxs.cloudfront.net` |
| Custom Domain | `govcontract-ai.hapotech.com` |
| Origin | `ec2-35-173-103-83.compute-1.amazonaws.com:3005` |
| Origin Protocol | HTTP |
| Viewer Protocol | Redirect HTTP to HTTPS |
| SSL Certificate | `arn:aws:acm:us-east-1:766669461090:certificate/39b9ff0f-92ba-4b30-8e1a-e75872de22db` |

### API Distribution
| Property | Value |
|----------|-------|
| Distribution ID | `E22O410H6BO5AF` |
| CloudFront Domain | `d1ntjd1d3nmhbf.cloudfront.net` |
| Custom Domain | `api.govcontract-ai.hapotech.com` |
| Origin | `ec2-35-173-103-83.compute-1.amazonaws.com:8000` |
| Origin Protocol | HTTP |
| Viewer Protocol | Redirect HTTP to HTTPS |
| SSL Certificate | `arn:aws:acm:us-east-1:766669461090:certificate/2d643318-c745-4b2a-992e-6d6a82854ec0` |

---

## Route 53 DNS Records

| Record | Type | Target |
|--------|------|--------|
| `govcontract-ai.hapotech.com` | A (Alias) | `d246k2epie5kxs.cloudfront.net` |
| `api.govcontract-ai.hapotech.com` | A (Alias) | `d1ntjd1d3nmhbf.cloudfront.net` |

Hosted Zone: `Z0774871S58VKRYXD2JC` (hapotech.com)

---

## EC2 Services

| Service | Port | Status | Command |
|---------|------|--------|---------|
| `govai-frontend.service` | 3005 | Active | `sudo systemctl status govai-frontend` |
| `govai-api.service` | 8000 | Active | `sudo systemctl status govai-api` |

### Service Management
```bash
# SSH to server
ssh ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com

# Restart services
sudo systemctl restart govai-api
sudo systemctl restart govai-frontend

# View logs
sudo journalctl -u govai-api -f
sudo journalctl -u govai-frontend -f
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| POST | `/api/v1/auth/verify-email` | Verify email |
| POST | `/api/v1/auth/unsubscribe` | Unsubscribe from emails |

### Company
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/company/me` | Get current user's company |
| PUT | `/api/v1/company/{id}` | Update company |

### Opportunities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/opportunities/` | List opportunities |
| GET | `/api/v1/opportunities/{id}` | Get opportunity details |
| GET | `/api/v1/opportunities/pipeline` | Get pipeline opportunities |
| POST | `/api/v1/opportunities/{id}/status` | Update opportunity status |

### Evaluations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/evaluations/` | List evaluations |
| POST | `/api/v1/evaluations/{id}/rescore` | Rescore evaluation |
| POST | `/api/v1/evaluations/bulk-rescore` | Bulk rescore evaluations |

### Agencies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agencies/` | List agencies |
| GET | `/api/v1/agencies/{id}` | Get agency details |
| GET | `/api/v1/agencies/recommended` | Get recommended agencies |
| GET | `/api/v1/agencies/{id}/contacts` | Get agency contacts |
| GET | `/api/v1/agencies/{id}/match` | Get match score breakdown |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents/` | List documents |
| POST | `/api/v1/documents/upload` | Upload document |
| GET | `/api/v1/documents/certifications/` | List certifications |
| POST | `/api/v1/documents/certifications/` | Add certification |
| GET | `/api/v1/documents/past-performance/` | List past performance |
| POST | `/api/v1/documents/past-performance/` | Add past performance |

### Awards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/awards/` | List awards |
| GET | `/api/v1/awards/stats` | Get award statistics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health (DB check) |
| GET | `/ready` | Readiness check |

---

## S3 Buckets

| Bucket | Purpose |
|--------|---------|
| `govai-frontend-prod` | Frontend static assets (unused - using EC2) |

---

## ACM Certificates

| Domain | ARN | Status |
|--------|-----|--------|
| `govcontract-ai.hapotech.com` | `arn:aws:acm:us-east-1:766669461090:certificate/39b9ff0f-92ba-4b30-8e1a-e75872de22db` | Issued |
| `api.govcontract-ai.hapotech.com` | `arn:aws:acm:us-east-1:766669461090:certificate/2d643318-c745-4b2a-992e-6d6a82854ec0` | Issued |

---

## Deployment

### Quick Deploy (Code Only)
```bash
# From project root
./deploy-quick.sh
```

### Frontend Deploy
```bash
# Build with production API
cd frontend
NEXT_PUBLIC_API_URL="https://api.govcontract-ai.hapotech.com/api/v1" npm run build

# Sync to EC2
rsync -avz --delete .next/standalone/ ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com:/opt/govai/frontend/
rsync -avz .next/static ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com:/opt/govai/frontend/.next/

# Restart service
ssh ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com "sudo systemctl restart govai-frontend"
```

### Backend Deploy
```bash
# Sync code
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.env' --exclude 'venv' backend/ ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com:/opt/govai/backend/

# Restart service
ssh ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com "sudo systemctl restart govai-api"
```
