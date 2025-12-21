# User Story: Proposal Manager

## Persona: Jennifer Williams

**Role**: Proposal Manager
**Company Size**: 500+ employees (large government contractor)
**Experience**: 15 years in proposal development
**Focus**: Quality proposals with high win rates
**Goal**: Improve proposal quality using AI insights

---

## User Journey

### 1. Receiving Qualified Opportunities

**Scenario**: Jennifer receives opportunities from BD team that have been qualified by AI.

**Actions**:
1. Logs into GovAI
2. Views Pipeline filtered by "BIDDING" status
3. Reviews opportunities assigned to proposal development
4. For each opportunity, reviews:
   - AI fit score and win probability
   - Key requirements identified by AI
   - Risk factors flagged
   - BD manager notes
5. Prioritizes proposal development schedule

**Acceptance Criteria**:
- Clear view of opportunities in BIDDING status
- Complete AI analysis available
- BD notes visible and searchable
- Sort by deadline or priority
- Export capability for proposal planning

---

### 2. Understanding Requirements

**Scenario**: Jennifer needs to quickly understand what the opportunity requires.

**Actions**:
1. Opens opportunity detail page
2. Reviews AI-extracted key requirements:
   - "SECRET clearance required for all personnel"
   - "Minimum 5 years of relevant experience"
   - "AWS Government Cloud certification"
   - "Prior USDA experience preferred"
3. Reviews AI-identified strengths to emphasize
4. Reviews AI-identified weaknesses to address
5. Adds notes about proposal strategy
6. Links to original SAM.gov posting

**Acceptance Criteria**:
- Key requirements clearly listed
- Strengths/weaknesses actionable
- Link to source document
- Notes field for strategy
- Print-friendly format

---

### 3. Risk Assessment

**Scenario**: Jennifer needs to understand and mitigate risks before committing resources.

**Actions**:
1. Reviews AI-identified risk factors:
   - "Incumbent has strong relationship with agency"
   - "Aggressive timeline - 21 days to respond"
   - "Price likely to be key discriminator"
   - "Technical requirements heavily weighted"
2. Documents mitigation strategies in notes
3. Discusses with BD manager
4. Makes Go/No-Go recommendation
5. Updates opportunity status based on decision

**Acceptance Criteria**:
- Risk factors clearly categorized
- Severity indicators if available
- Space for mitigation notes
- Status update workflow
- Audit trail of decisions

---

### 4. Tracking Proposal Progress

**Scenario**: Jennifer tracks multiple active proposals through development.

**Actions**:
1. Views Pipeline board
2. Monitors BIDDING opportunities:
   - "DOD IT Modernization" - Due in 14 days
   - "VA Health Records" - Due in 7 days
   - "DHS Cybersecurity" - Due in 21 days
3. Updates notes with proposal milestones
4. Receives deadline reminder emails
5. Marks submitted proposals for outcome tracking

**Acceptance Criteria**:
- Clear deadline visibility
- Notes support milestone tracking
- Email reminders configurable
- Status can reflect submission
- Deadline countdown displayed

---

### 5. Learning from Outcomes

**Scenario**: Jennifer wants to improve future proposals based on past results.

**Actions**:
1. Updates opportunity status: WON or LOST
2. Adds outcome notes:
   - Win: "Technical approach differentiated us"
   - Loss: "Price was too high despite strong technical"
3. Reviews win rate statistics
4. Analyzes correlation between AI scores and outcomes
5. Provides feedback for AI improvement

**Acceptance Criteria**:
- Easy outcome recording
- Notes field for lessons learned
- Win rate automatically calculated
- Historical data accessible
- Export for analysis

---

## Key Features Used

### Opportunity Analysis
- AI-extracted key requirements
- Strengths and weaknesses analysis
- Risk factor identification
- Win probability assessment
- Fit score evaluation

### Pipeline Management
- BIDDING status tracking
- Deadline monitoring
- Progress notes
- Outcome recording
- Win/loss analysis

### Notifications
- Deadline reminders
- New opportunity alerts
- Status change notifications

---

## User Needs

### Must Have
- Clear requirement extraction
- Risk factor visibility
- Deadline tracking
- Notes for strategy documentation
- Win/loss tracking

### Should Have
- Print-friendly analysis
- Export capabilities
- Historical outcome data
- Win rate analytics

### Nice to Have
- Proposal template integration
- Team assignment features
- Compliance matrix generation
- Automated outline creation

---

## Integration with Proposal Process

### Capture Phase (BD → Proposal)
1. BD qualifies opportunity using AI
2. Saves to pipeline as BIDDING
3. Adds qualification notes
4. Jennifer receives notification

### Proposal Development
1. Jennifer reviews AI analysis
2. Extracts requirements for compliance matrix
3. Addresses identified weaknesses
4. Emphasizes identified strengths
5. Documents progress in notes

### Submission and Follow-up
1. Updates status after submission
2. Records outcome when known
3. Documents lessons learned
4. Contributes to win rate metrics

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to understand requirements | < 30 minutes |
| Risk factors identified pre-proposal | 100% |
| Proposal win rate | > 40% |
| Missed deadlines | 0 |
| Lessons learned documented | 100% |

---

## Value Proposition

### Time Savings
- Requirement extraction: 2 hours → 15 minutes
- Risk assessment: 1 hour → 10 minutes
- Competitor research: Embedded in AI analysis

### Quality Improvements
- Complete requirement coverage
- Proactive risk mitigation
- Data-driven Go/No-Go decisions
- Continuous learning from outcomes

### Team Alignment
- Shared understanding via AI analysis
- Consistent qualification criteria
- Documented decision rationale
- Transparent pipeline status
