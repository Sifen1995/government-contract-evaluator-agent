# GovAI Documentation

Welcome to the GovAI documentation. This guide will help you understand, deploy, and use the AI-powered government contract discovery platform.

## Quick Links

- [Getting Started Guide](guides/getting-started.md) - Set up the platform locally
- [System Architecture](architecture/system-architecture.md) - Technical architecture overview
- [API Documentation](api/README.md) - Complete API reference
- [Deployment Guide](../DEPLOYMENT.md) - Production deployment instructions

## Documentation Structure

```
docs/
├── README.md                           # This file
├── guides/
│   └── getting-started.md              # Quick start guide
├── architecture/
│   └── system-architecture.md          # System design and components
├── api/
│   └── README.md                       # API endpoints reference
└── user-stories/
    ├── small-business-owner.md         # Small business user journey
    ├── bd-manager.md                   # Business development user journey
    └── proposal-manager.md             # Proposal manager user journey
```

## Overview

GovAI is an AI-powered platform that helps businesses discover and evaluate government contracting opportunities. The platform automatically:

1. **Discovers** opportunities from SAM.gov matching your NAICS codes
2. **Evaluates** each opportunity using AI (GPT-4) against your company profile
3. **Recommends** BID, NO_BID, or RESEARCH for each opportunity
4. **Notifies** you of new matches and upcoming deadlines
5. **Tracks** your pipeline from discovery to win/loss

## Key Features

### For Users
- AI-powered opportunity evaluation
- BID/NO_BID/RESEARCH recommendations
- Fit scores and win probability estimates
- Pipeline management (Kanban-style board)
- Email notifications and deadline reminders

### Technical Features
- RESTful API with FastAPI
- JWT authentication
- Background task processing (Celery)
- Automated discovery scheduling
- Health monitoring endpoints

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | MySQL 8.0 |
| Cache | Redis 7 |
| Task Queue | Celery |
| AI | OpenAI GPT-4 |
| Email | SendGrid |
| Deployment | Docker, Docker Compose |

## User Personas

This platform serves three primary user types:

### 1. Small Business Owner
New to government contracting, needs guidance on which opportunities to pursue.
- [Read User Story](user-stories/small-business-owner.md)

### 2. Business Development Manager
Manages high volumes of opportunities, needs efficient qualification process.
- [Read User Story](user-stories/bd-manager.md)

### 3. Proposal Manager
Develops proposals, needs detailed requirements and risk analysis.
- [Read User Story](user-stories/proposal-manager.md)

## Getting Help

### Development
- **API Docs**: http://localhost:8000/docs (when running locally)
- **Logs**: `docker-compose logs -f`
- **Container Status**: `docker-compose ps`

### Support
- Check the [Getting Started Guide](guides/getting-started.md) for common issues
- Review [API Documentation](api/README.md) for endpoint details
- See [System Architecture](architecture/system-architecture.md) for technical overview

## Contributing

This is an MVP development project. Key development files:

- Backend code: `backend/`
- Frontend code: `frontend/`
- Docker configuration: `docker-compose.yml`
- Environment template: `.env.example`

## License

Proprietary - All rights reserved
