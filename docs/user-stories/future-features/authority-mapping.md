# User Story: Government Contact Matchmaking & Authority Mapping

## Overview

**Feature**: Government Contact Matchmaking & Authority Mapping
**Requirement Reference**: Requirement #2 from AI_Procurement_Platform_Updated_Requirements.docx.md
**Status**: ✅ IMPLEMENTED (2024-12-23)
**Priority**: HIGH
**Estimated Effort**: 1-2 weeks

> **Implementation Notes:**
> - Database migration: `006_add_authority_mapping.py`
> - Models: `app/models/agency.py`
> - Service: `app/services/agency.py`
> - API: `app/api/v1/agencies.py`
> - Schemas: `app/schemas/agency.py`

---

## Business Value

### Current State
- Opportunity contact information is captured (contact_name, contact_email, contact_phone)
- Issuing agency metadata is stored (issuing_agency, issuing_sub_agency, issuing_office)
- **No matching algorithm** exists to recommend appropriate contacts for a business
- **No authority recommendation** based on business profile and opportunity metadata
- Users must manually research which agencies/contacts are relevant

### Target State
- AI automatically matches businesses to appropriate government authorities
- Platform surfaces recommended contracting officers and small business liaisons
- Authority recommendations displayed within each opportunity
- Businesses can discover which agencies are best fit for their capabilities
- Contact information enriched with additional data (OSDBU contacts, etc.)

### ROI Impact
- **Time Savings**: Eliminates manual research on who to contact
- **Higher Win Rates**: Connecting with right contacts improves bid success
- **Relationship Building**: Helps businesses establish government relationships
- **Competitive Advantage**: Unique feature differentiating from basic aggregators

---

## User Stories

### US-AUTH-1: View Recommended Authorities on Opportunity Detail

**As a** small business exploring an opportunity
**I want to** see which government authorities and contacts are relevant
**So that** I know who to reach out to for questions and relationship building

**Acceptance Criteria:**
- [ ] Opportunity detail page shows "Recommended Contacts" section
- [ ] Displays contracting officer from opportunity (if available)
- [ ] Displays agency small business liaison (OSDBU contact)
- [ ] Displays industry liaison if available
- [ ] Contact information includes name, title, email, phone when available
- [ ] "Copy email" button for quick access
- [ ] Links to agency small business page

**UI Wireframe:**
```
+----------------------------------------------------------+
|  Opportunity Detail                                        |
+----------------------------------------------------------+
|  [Title, Description, etc.]                                |
|                                                            |
|  Recommended Contacts                                      |
|  +------------------------------------------------------+  |
|  | Contracting Officer                                   |  |
|  | John Smith                                            |  |
|  | john.smith@agency.gov | (202) 555-1234               |  |
|  | [Copy Email] [View Profile]                           |  |
|  +------------------------------------------------------+  |
|  | Small Business Liaison (OSDBU)                        |  |
|  | Maria Garcia                                          |  |
|  | maria.garcia@agency.gov | (202) 555-5678             |  |
|  | [Copy Email] [View Agency SB Page]                    |  |
|  +------------------------------------------------------+  |
|  | Industry Day Contact                                  |  |
|  | [No contact available for this opportunity]           |  |
|  +------------------------------------------------------+  |
|                                                            |
+----------------------------------------------------------+
```

---

### US-AUTH-2: Business-to-Authority Matching

**As a** small business owner
**I want to** see which government agencies are the best fit for my capabilities
**So that** I can focus my business development efforts on high-potential agencies

**Acceptance Criteria:**
- [ ] Dashboard shows "Top Agencies for Your Business" widget
- [ ] Agencies ranked by match score (based on NAICS, set-asides, past awards)
- [ ] Shows number of active opportunities per agency
- [ ] Shows average contract value for matching opportunities
- [ ] Click agency to see all opportunities from that agency
- [ ] Filter opportunities page by recommended agencies

**Algorithm Factors:**
- NAICS code overlap between company and agency's historical awards
- Set-aside alignment (agency's small business goals)
- Geographic match (agency locations vs company preferences)
- Historical win rate data from USAspending
- Opportunity volume and value

**UI Wireframe:**
```
+----------------------------------------------------------+
|  Dashboard                                                 |
+----------------------------------------------------------+
|                                                            |
|  Top Agencies for Your Business                            |
|  +------------------------------------------------------+  |
|  | 1. Department of Veterans Affairs           92% match |  |
|  |    15 active opportunities | Avg. value: $2.5M        |  |
|  |    [View Opportunities] [Agency Profile]              |  |
|  +------------------------------------------------------+  |
|  | 2. Department of Health & Human Services    87% match |  |
|  |    23 active opportunities | Avg. value: $1.8M        |  |
|  |    [View Opportunities] [Agency Profile]              |  |
|  +------------------------------------------------------+  |
|  | 3. General Services Administration          85% match |  |
|  |    42 active opportunities | Avg. value: $500K        |  |
|  |    [View Opportunities] [Agency Profile]              |  |
|  +------------------------------------------------------+  |
|                                                            |
|  [View All Agencies]                                       |
|                                                            |
+----------------------------------------------------------+
```

---

### US-AUTH-3: Agency Profile Page

**As a** business development manager
**I want to** view detailed information about a government agency
**So that** I can understand their contracting patterns and key contacts

**Acceptance Criteria:**
- [ ] Agency profile page with overview, contacts, and statistics
- [ ] Small business goals and achievements displayed
- [ ] Historical award data from USAspending
- [ ] Top NAICS codes awarded by agency
- [ ] Key contacts (OSDBU director, procurement chief, etc.)
- [ ] Link to agency forecast (if available)
- [ ] Link to agency vendor portal/registration

**Data Sources:**
- SAM.gov agency data
- USAspending award history
- SBA OSDBU directory
- Agency small business websites (scraped/manual)

---

### US-AUTH-4: Contact Database & Enrichment

**As a** platform administrator
**I want to** maintain a database of government contracting contacts
**So that** users can access accurate and enriched contact information

**Acceptance Criteria:**
- [ ] Database of OSDBU contacts (from SBA directory)
- [ ] Database of agency procurement contacts
- [ ] Regular updates from authoritative sources
- [ ] Manual enrichment capability for admins
- [ ] Contact data validation and deduplication
- [ ] Historical tracking of contact changes

**Data Model:**
```python
class GovernmentContact(Base):
    id = Column(UUID, primary_key=True)

    # Identity
    first_name = Column(String(100))
    last_name = Column(String(100))
    title = Column(String(255))

    # Contact info
    email = Column(String(255))
    phone = Column(String(50))

    # Organization
    agency_id = Column(UUID, ForeignKey("agencies.id"))
    office_name = Column(String(255))

    # Role
    contact_type = Column(String(50))  # osdbu, contracting_officer, industry_liaison

    # Source
    source = Column(String(50))  # sba_directory, sam_gov, manual
    source_url = Column(String(500))
    last_verified = Column(DateTime)

    # Status
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime)
    updated_at = Column(DateTime)


class Agency(Base):
    id = Column(UUID, primary_key=True)

    # Identity
    name = Column(String(255), nullable=False)
    abbreviation = Column(String(20))

    # Hierarchy
    parent_agency_id = Column(UUID, ForeignKey("agencies.id"))
    level = Column(String(20))  # department, agency, sub_agency, office

    # Metadata
    sam_gov_id = Column(String(50))
    usaspending_id = Column(String(50))

    # Small Business Info
    small_business_url = Column(String(500))
    forecast_url = Column(String(500))
    vendor_portal_url = Column(String(500))

    # Goals
    small_business_goal_pct = Column(Numeric(5,2))
    eight_a_goal_pct = Column(Numeric(5,2))
    wosb_goal_pct = Column(Numeric(5,2))
    sdvosb_goal_pct = Column(Numeric(5,2))
    hubzone_goal_pct = Column(Numeric(5,2))

    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

---

### US-AUTH-5: Authority Recommendation Algorithm

**As a** platform system
**I want to** calculate authority match scores for each business
**So that** I can recommend the most relevant agencies and contacts

**Acceptance Criteria:**
- [ ] Algorithm considers NAICS code overlap
- [ ] Algorithm considers set-aside alignment with agency goals
- [ ] Algorithm considers geographic factors
- [ ] Algorithm considers historical award data
- [ ] Scores calculated on-demand or cached daily
- [ ] Scores explainable (reasoning provided)

**Algorithm Implementation:**
```python
def calculate_agency_match_score(company: Company, agency: Agency) -> dict:
    """
    Calculate how well a company matches an agency's contracting patterns.

    Returns:
        {
            "score": 0-100,
            "factors": {
                "naics_alignment": 0-100,
                "set_aside_alignment": 0-100,
                "geographic_fit": 0-100,
                "award_history_fit": 0-100
            },
            "reasoning": "..."
        }
    """

    # Factor 1: NAICS Alignment (40% weight)
    # Compare company NAICS to agency's historical awards
    agency_naics = get_agency_top_naics(agency.id)
    naics_overlap = set(company.naics_codes) & set(agency_naics)
    naics_score = min(100, len(naics_overlap) * 25)

    # Factor 2: Set-Aside Alignment (30% weight)
    # Compare company certifications to agency SB goals
    set_aside_score = 0
    if "8(a)" in company.set_asides and agency.eight_a_goal_pct > 3:
        set_aside_score += 30
    if "WOSB" in company.set_asides and agency.wosb_goal_pct > 3:
        set_aside_score += 25
    # ... etc

    # Factor 3: Geographic Fit (15% weight)
    # Compare company location to agency's contracting locations
    agency_locations = get_agency_pop_locations(agency.id)
    geo_score = calculate_geo_overlap(company.geographic_preferences, agency_locations)

    # Factor 4: Award History Fit (15% weight)
    # Look at company size vs agency's typical award values
    avg_agency_award = get_agency_avg_award_value(agency.id)
    if company.contract_value_min <= avg_agency_award <= company.contract_value_max:
        award_score = 100
    else:
        award_score = 50  # Partial match

    # Weighted combination
    overall_score = (
        naics_score * 0.40 +
        set_aside_score * 0.30 +
        geo_score * 0.15 +
        award_score * 0.15
    )

    return {
        "score": round(overall_score),
        "factors": {
            "naics_alignment": naics_score,
            "set_aside_alignment": set_aside_score,
            "geographic_fit": geo_score,
            "award_history_fit": award_score
        },
        "reasoning": generate_reasoning(...)
    }
```

---

## API Endpoints

```
# Agency endpoints
GET    /api/v1/agencies/                      - List all agencies
GET    /api/v1/agencies/{id}                  - Get agency details
GET    /api/v1/agencies/{id}/contacts         - Get agency contacts
GET    /api/v1/agencies/{id}/stats            - Get agency statistics
GET    /api/v1/agencies/recommended           - Get recommended agencies for user's company

# Contact endpoints
GET    /api/v1/contacts/                      - List contacts (admin only)
GET    /api/v1/contacts/{id}                  - Get contact details
GET    /api/v1/opportunities/{id}/contacts    - Get recommended contacts for opportunity

# Matching endpoints
GET    /api/v1/matching/agencies              - Get agency match scores for company
GET    /api/v1/matching/agencies/{id}         - Get detailed match analysis for agency
```

---

## Database Migrations

```sql
-- Migration: Create agencies table
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20),
    parent_agency_id UUID REFERENCES agencies(id),
    level VARCHAR(20),
    sam_gov_id VARCHAR(50),
    usaspending_id VARCHAR(50),
    small_business_url VARCHAR(500),
    forecast_url VARCHAR(500),
    vendor_portal_url VARCHAR(500),
    small_business_goal_pct NUMERIC(5,2),
    eight_a_goal_pct NUMERIC(5,2),
    wosb_goal_pct NUMERIC(5,2),
    sdvosb_goal_pct NUMERIC(5,2),
    hubzone_goal_pct NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agencies_name ON agencies(name);
CREATE INDEX idx_agencies_parent ON agencies(parent_agency_id);

-- Migration: Create government_contacts table
CREATE TABLE government_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    title VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    agency_id UUID REFERENCES agencies(id),
    office_name VARCHAR(255),
    contact_type VARCHAR(50),
    source VARCHAR(50),
    source_url VARCHAR(500),
    last_verified TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_agency ON government_contacts(agency_id);
CREATE INDEX idx_contacts_type ON government_contacts(contact_type);
CREATE INDEX idx_contacts_email ON government_contacts(email);

-- Migration: Create company_agency_matches table (cached scores)
CREATE TABLE company_agency_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    match_score INTEGER,
    naics_score INTEGER,
    set_aside_score INTEGER,
    geographic_score INTEGER,
    award_history_score INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, agency_id)
);

CREATE INDEX idx_agency_matches_company ON company_agency_matches(company_id);
CREATE INDEX idx_agency_matches_score ON company_agency_matches(match_score DESC);
```

---

## Data Sources for Contact Enrichment

### SBA OSDBU Directory
- URL: https://www.sba.gov/federal-contracting/counseling-help/osdbu-directory
- Contains: OSDBU directors and contacts for all federal agencies
- Update frequency: Scrape monthly

### SAM.gov
- Already integrated
- Contains: Contracting officers on opportunities
- Update frequency: Real-time from opportunities

### USAspending.gov
- Already integrated
- Contains: Awarding/funding agency data
- Update frequency: Daily from awards

### Agency Websites (Manual/Scraped)
- Small business pages
- Forecast pages
- Industry day contacts
- Update frequency: Quarterly manual review

---

## Testing Requirements

### E2E Test Cases to Add

| Test ID | Scenario | Steps |
|---------|----------|-------|
| TC-AUTH-1 | View recommended contacts on opportunity | Navigate to opportunity detail → Verify contacts section shown |
| TC-AUTH-2 | Copy contact email | Click "Copy Email" → Verify copied to clipboard |
| TC-AUTH-3 | View top agencies on dashboard | Login → Verify "Top Agencies" widget shows recommendations |
| TC-AUTH-4 | Filter opportunities by recommended agency | Click agency → Verify filtered to that agency |
| TC-AUTH-5 | View agency profile | Click "Agency Profile" → Verify page loads with stats |
| TC-AUTH-6 | Agency match score explanation | View recommended agencies → Verify score breakdown shown |
| TC-AUTH-7 | No contacts available | View opportunity without contacts → Verify graceful empty state |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Agency match coverage | > 90% of opportunities have agency data |
| Contact enrichment rate | > 50% of agencies have OSDBU contact |
| User engagement | > 30% of users click on recommended agencies |
| Contact accuracy | < 10% bounce rate on copied emails |

---

## Dependencies

- USAspending award data ingested (already done)
- Agency hierarchy normalized from SAM.gov data
- SBA OSDBU directory scraped/imported
- Caching infrastructure for match scores

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Contact data becomes stale | MEDIUM | Regular verification, user feedback mechanism |
| Agency hierarchy complexity | LOW | Focus on top-level agencies first |
| OSDBU directory changes | MEDIUM | Automated monitoring, manual quarterly review |
| Performance (many agencies) | LOW | Cache match scores, paginate results |
