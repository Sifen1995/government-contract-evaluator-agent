# GovRat Competitor Feature Analysis - Requirements Document

**Source:** Video analysis of GovRat daily email digest
**Date:** December 22, 2025
**Purpose:** Feature parity requirements for GovAI platform

---

## Executive Summary

GovRat is a competitor government contract discovery platform that provides AI-powered daily email digests with detailed cost analysis and profit estimates. This document outlines the key features observed and translates them into actionable requirements for GovAI.

---

## 1. Daily Email Digest

### 1.1 Email Structure
**Requirement:** Implement a daily email digest system that delivers personalized contract opportunities.

| Feature | Description | Priority |
|---------|-------------|----------|
| Email Subject | "Your Daily Contract Opportunities for [Date]" | High |
| Top Opportunities | Curated list of top 5 opportunities | High |
| AI-Powered Insights | AI analysis summary for each opportunity | High |
| Personalization | Based on user's company profile and NAICS codes | High |

### 1.2 Email Components
- **Header:** Branded header with date
- **Body:** List of opportunity cards with AI insights
- **Footer:** Subscription management links, unsubscribe option
- **CTA Buttons:** "SAVE IN [PLATFORM]" action buttons

---

## 2. Opportunity Card Display

### 2.1 Basic Opportunity Information
**Requirement:** Each opportunity must display the following fields in a clean card format.

| Field | Description | Display Format |
|-------|-------------|----------------|
| Title | Contract/opportunity name | Bold, prominent |
| Status | Current status | Badge (e.g., green "ACTIVE") |
| Type | Opportunity type | Text label |
| Response Deadline | Due date/time | ISO 8601 format |
| NAICS Code | Industry classification | 6-digit code |
| Set-Aside | Small business designation | Full text description |

### 2.2 Opportunity Types to Support
- RFP (Request for Proposal)
- Sources Sought
- Solicitation
- Presolicitation
- Combined Synopsis/Solicitation

### 2.3 Set-Aside Types to Display
- Total Small Business Set-Aside (FAR 19.5)
- Service-Disabled Veteran-Owned Small Business Set-Aside (SDVOSB)
- 8(a) Set-Aside
- HUBZone Set-Aside
- Woman-Owned Small Business (WOSB)
- No Set-Aside Used

---

## 3. AI Analysis Features (HIGH PRIORITY)

### 3.1 Financial Estimates
**Requirement:** Provide AI-generated financial projections for each opportunity.

| Metric | Description | Example |
|--------|-------------|---------|
| **Estimated Award** | Total contract value estimate | $531,000, $184,500 |
| **Estimated Profit** | Projected profit margin | $95,580 (18%), $27,675 (15%) |

### 3.2 Opportunity Overview
**Requirement:** Generate AI-written summary of the opportunity.

- Concise description of the contract scope
- Key requirements and objectives
- Target agency and department
- Contract duration/period of performance

### 3.3 Key Tasks & Cost Breakdown
**Requirement:** AI-generated work breakdown structure with cost estimates.

**Format for each task:**
```
Task Name
Description of the task scope and deliverables
Estimated Cost: $XX,XXX (± $X,XXX)
```

**Example Tasks Observed:**
| Task | Estimated Cost | Variance |
|------|---------------|----------|
| Initial CRM Platform Subscription | $61,200 | ± $20,000 |
| Project Management & Planning | $45,000 | ± $15,000 |
| System Configuration & Workflow | $75,000 | ± $25,000 |
| Data Migration & Integration | $80,000 | ± $30,000 |
| Ongoing SaaS Subscription (Years 2-5) | $244,800 | ± $80,000 |
| Conduct Program Training | $4,500 | ± $1,500 |
| Provide Digital Copies of Procedures | $15,000 | ± $5,000 |

---

## 4. User Engagement Features

### 4.1 Save/Bookmark Functionality
**Requirement:** Allow users to save opportunities for detailed analysis.

- "SAVE IN GOVAI" button on each opportunity
- Saved opportunities unlock full AI analysis
- Teaser mode for unsaved opportunities: "AI Analysis Available - Save to unlock detailed AI insights, cost breakdowns, and profit estimates"

### 4.2 Notification Preferences
**Requirement:** User-configurable notification settings.

- Daily digest on/off toggle
- Frequency options (daily, weekly, immediate)
- Filter by NAICS codes
- Filter by set-aside types
- Minimum/maximum contract value thresholds
- Profile settings page for management

### 4.3 Unsubscribe Management
- One-click unsubscribe from emails
- Link to manage notification preferences
- GDPR/CAN-SPAM compliance

---

## 5. Technical Requirements

### 5.1 Email Delivery System
| Requirement | Specification |
|-------------|---------------|
| Email Provider | SendGrid (existing) |
| Send Time | Configurable (default: 8 AM user timezone) |
| Template Engine | HTML email templates with responsive design |
| Tracking | Open rates, click-through rates |

### 5.2 AI Cost Estimation Engine
| Requirement | Specification |
|-------------|---------------|
| Model | GPT-4 or equivalent |
| Input | Opportunity description, NAICS code, historical data |
| Output | Structured JSON with cost breakdown |
| Accuracy | ± 20-30% variance range |

### 5.3 Data Structure Updates

**New Fields for Evaluation Model:**
```python
class Evaluation:
    # Existing fields...

    # New AI Analysis fields
    estimated_award_value: Optional[float]
    estimated_profit: Optional[float]
    profit_margin_percentage: Optional[float]
    opportunity_overview: Optional[str]  # AI-generated summary

    # Cost breakdown (JSON)
    cost_breakdown: Optional[dict]  # {task_name: {description, cost, variance}}
```

---

## 6. Implementation Phases

### Phase 1: Core Email Digest (MVP)
- [ ] Daily email digest with top 5 opportunities
- [ ] Basic opportunity cards with existing data
- [ ] "Save" functionality linked to existing pipeline
- [ ] Unsubscribe management

### Phase 2: AI Financial Analysis
- [ ] Estimated Award calculation using GPT-4
- [ ] Estimated Profit calculation
- [ ] Opportunity Overview generation
- [ ] Store analysis results in database

### Phase 3: Cost Breakdown Engine
- [ ] Work breakdown structure generation
- [ ] Individual task cost estimation
- [ ] Variance calculation
- [ ] Historical data integration for accuracy

### Phase 4: Advanced Personalization
- [ ] Machine learning-based opportunity ranking
- [ ] Win probability scoring
- [ ] Competitor analysis
- [ ] Bid/no-bid recommendation

---

## 7. UI/UX Requirements

### 7.1 Email Design
- Clean, modern card-based layout
- Mobile-responsive design
- Brand colors and logo
- Clear visual hierarchy
- Green "ACTIVE" status badges
- Blue CTA buttons

### 7.2 Color Scheme (Observed)
| Element | Color |
|---------|-------|
| Status Badge (Active) | Green (#22C55E) |
| CTA Buttons | Blue (#3B82F6) |
| Cost Estimates | Teal/Cyan (#14B8A6) |
| AI Analysis Banner | Light Yellow/Cream |
| Background | White |

---

## 8. API Endpoints Required

### New Endpoints
```
POST /api/v1/opportunities/{id}/save
GET  /api/v1/opportunities/{id}/ai-analysis
POST /api/v1/opportunities/{id}/generate-cost-breakdown
GET  /api/v1/user/notification-preferences
PUT  /api/v1/user/notification-preferences
POST /api/v1/email/unsubscribe
```

### Enhanced Existing Endpoints
```
GET /api/v1/evaluations - Add ai_analysis fields
GET /api/v1/stats - Add saved opportunities count
```

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Email Open Rate | > 40% |
| Click-Through Rate | > 15% |
| Save Rate | > 25% of opened emails |
| User Retention | > 80% monthly active |
| Cost Estimate Accuracy | Within ± 30% of actual awards |

---

## 10. Competitive Advantages to Build

1. **More accurate cost estimates** - Use historical award data from USASpending
2. **Better personalization** - ML-based matching vs rule-based
3. **Faster updates** - Real-time notifications vs daily digest only
4. **Integrated pipeline** - Full bid management workflow
5. **Team collaboration** - Multi-user support for larger companies

---

## Appendix: Sample Opportunities from Video

### Opportunity 1: CRM Platform Implementation
- **Type:** RFP
- **Estimated Award:** $531,000
- **Estimated Profit:** $95,580
- **NAICS:** 541330

### Opportunity 2: Albany VAMC Lockout/Tagout Services
- **Type:** Sources Sought
- **Set-Aside:** Service-Disabled Veteran-Owned Small Business
- **Estimated Award:** $184,500
- **Estimated Profit:** $27,675
- **NAICS:** 541330

### Opportunity 3: Professional Support Services for PEO USC
- **Type:** Sources Sought
- **Set-Aside:** No Set-Aside Used
- **NAICS:** 541330

### Opportunity 4: NUWC Keyport Acoustic Trial Support
- **Type:** Solicitation
- **Set-Aside:** Total Small Business Set-Aside (FAR 19.5)
- **NAICS:** 541330

### Opportunity 5: Tube Launched Optically Tracked Wireless 2 Subsystem
- **Type:** Presolicitation
- **Set-Aside:** No Set-Aside Used
- **NAICS:** 541330
