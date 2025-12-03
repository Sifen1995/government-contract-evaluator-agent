# User Story: Proposal Manager

## Persona: Emily Washington

**Role**: Proposal Manager
**Company**: Federal Solutions Group
**Industry**: Professional Services
**Experience**: 8 years in proposal management
**Team Size**: 3 proposal writers + 15 SMEs (shared)
**Annual Proposals**: 40-60 per year
**Average Proposal Value**: $750K

## Background

Emily manages the proposal development process from kickoff to submission. She coordinates with BD, technical teams, and executives to produce compliant, compelling proposals. Her biggest challenges are managing multiple concurrent proposals, ensuring deadlines are met, and maintaining quality under pressure.

## Goals

1. **Never Miss a Deadline**: Track all proposal milestones
2. **Improve Win Rate**: Ensure every proposal is high-quality and compliant
3. **Resource Management**: Optimize SME allocation across proposals
4. **Process Efficiency**: Reduce proposal development time
5. **Quality Assurance**: Maintain compliance and quality standards

## Pain Points

- **Surprise Proposals**: BD drops opportunities with short notice
- **Resource Conflicts**: Multiple proposals competing for same SMEs
- **Deadline Tracking**: Manual calendar management, easy to miss milestones
- **Inconsistent Information**: Opportunity details scattered across emails
- **No Early Warning**: Learns about opportunities too late in the cycle
- **Status Reporting**: Constantly answering "What's the status?" questions

## User Journey with GovAI

### Phase 1: Integration with BD Process (Week 1)

**Day 1: Setup Notification Preferences**
```
Action: Emily configures GovAI notifications

Settings:
┌──────────────────────────────────────────────────┐
│ Notification Preferences - Emily Washington      │
├──────────────────────────────────────────────────┤
│ Opportunity Alerts:                              │
│  ☑ When opportunity moved to "Preparing"        │
│  ☑ When opportunity assigned to me              │
│  ☐ Daily digest (BD team only)                  │
│                                                  │
│ Deadline Alerts:                                 │
│  ☑ 14 days before response deadline             │
│  ☑ 7 days before response deadline              │
│  ☑ 3 days before response deadline              │
│  ☑ 1 day before response deadline               │
│                                                  │
│ Milestone Reminders:                             │
│  ☑ Color team review scheduled                  │
│  ☑ Red team review scheduled                    │
│  ☑ Final compliance check due                   │
│                                                  │
│ Status Updates:                                  │
│  ☑ When notes added to my proposals             │
│  ☑ When documents uploaded                      │
│  ☑ When status changes                          │
└──────────────────────────────────────────────────┘

Result: Automated workflow notifications configured
Time: 10 minutes
```

**Day 2: Connect Proposal Calendar**
```
Action: Emily reviews upcoming proposal deadlines

GovAI Calendar View:
┌──────────────────────────────────────────────────┐
│ Proposal Calendar - December 2025                │
├──────────────────────────────────────────────────┤
│ Week 1 (Dec 1-7):                               │
│  Dec 3: VA Cloud Infrastructure - Kickoff       │
│  Dec 5: DoD Cybersecurity - Color Review        │
│  Dec 7: FBI Network Security - Submission       │
│                                                  │
│ Week 2 (Dec 8-14):                              │
│  Dec 10: GSA Facilities - Kickoff               │
│  Dec 12: DoD Cybersecurity - Red Team           │
│  Dec 14: DHS Training Services - Submission     │
│                                                  │
│ Week 3 (Dec 15-21):                             │
│  Dec 15: VA Cloud Infrastructure - Color Review │
│  Dec 18: GSA Facilities - Draft Complete        │
│  Dec 20: DoD Cybersecurity - Submission         │
│                                                  │
│ Workload Indicator:                              │
│  Week 1: ████████░░ 80% capacity                │
│  Week 2: ██████████ 100% capacity ⚠            │
│  Week 3: ██████░░░░ 60% capacity                │
│                                                  │
│ [Export to Outlook] [Share with Team]           │
└──────────────────────────────────────────────────┘

Result: Full visibility into proposal schedule
Time: 5 minutes to review
```

### Phase 2: Proposal Kickoff (Week 2)

**Monday Morning - New Proposal Assignment**
```
Notification:
┌──────────────────────────────────────────────────┐
│ GovAI Notification                               │
├──────────────────────────────────────────────────┤
│ New Proposal Assigned                            │
│                                                  │
│ DoD Enterprise IT Modernization                  │
│ Solicitation: HQ0034-25-R-0045                  │
│                                                  │
│ Fit Score: 92/100                               │
│ Win Probability: 75%                            │
│ Contract Value: $15M                            │
│ Response Deadline: January 15, 2026             │
│ Time Available: 43 days                         │
│                                                  │
│ AI Analysis Available:                           │
│  • Strengths & weaknesses identified            │
│  • Key discriminators highlighted               │
│  • Past performance requirements                │
│  • Compliance considerations                    │
│                                                  │
│ Assigned by: Michael Rodriguez (BD Manager)     │
│ Priority: HIGH                                   │
│                                                  │
│ [View Full Details] [Schedule Kickoff]          │
└──────────────────────────────────────────────────┘

Action: Emily clicks "View Full Details"
Time: 10:00 AM
```

**Proposal Details Review**
```
GovAI Opportunity Page:
┌──────────────────────────────────────────────────┐
│ DoD Enterprise IT Modernization                  │
│ [92] Fit Score | Recommendation: BID            │
├──────────────────────────────────────────────────┤
│ OVERVIEW:                                        │
│  Agency: Department of Defense (CIO Office)     │
│  NAICS: 541512 (Computer Systems Design)        │
│  Set-Aside: 8(a) Program                        │
│  Value: $15M (5-year IDIQ)                      │
│  Posted: Nov 28, 2025                           │
│  Questions Due: Dec 18, 2025                    │
│  Proposals Due: Jan 15, 2026, 2:00 PM ET       │
│                                                  │
│ KEY REQUIREMENTS:                                │
│  ✓ Cloud migration expertise (AWS/Azure)       │
│  ✓ DoD Impact Level 5 experience               │
│  ✓ Active Secret clearances (10+ personnel)    │
│  ✓ CMMI Level 3 or equivalent                  │
│  ✓ 3 past performance references (similar)     │
│                                                  │
│ AI INSIGHTS:                                     │
│  Strengths (Why we should win):                 │
│   • Exact NAICS match (541512)                 │
│   • Strong 8(a) eligibility                    │
│   • Previous DoD CIO work (2 contracts)        │
│   • AWS & Azure certifications on staff        │
│   • CMMI Level 3 certified                     │
│                                                  │
│  Weaknesses (Risks to address):                 │
│   • Limited IL5 experience (only 1 contract)   │
│   • May need to beef up clearance count        │
│                                                  │
│  Discriminators (How to stand out):             │
│   • Emphasize recent CIO-level relationships   │
│   • Highlight innovative DevSecOps approach    │
│   • Showcase cost savings from past projects   │
│                                                  │
│ PROPOSAL STRATEGY RECOMMENDATIONS:               │
│  1. Lead with DoD CIO past performance         │
│  2. Address IL5 gap with teaming partner       │
│  3. Emphasize rapid delivery track record      │
│  4. Include executive relationship narrative   │
│                                                  │
│ DOCUMENTS:                                       │
│  📄 RFP (148 pages) - Downloaded Nov 28        │
│  📄 Q&A Amendment 001 - Downloaded Dec 3       │
│  📄 Draft PWS - Downloaded Nov 28              │
│                                                  │
│ NOTES (from BD team):                            │
│  Nov 28 - Jennifer: "Spoke with COR, emphasized │
│           innovation and agile delivery"        │
│  Dec 1 - Michael: "CEO approved, allocate      │
│          top resources to this one"            │
│                                                  │
│ [Schedule Kickoff] [Add to Proposal Tracker]   │
└──────────────────────────────────────────────────┘

Emily's Reaction: "This is exactly what I need! The AI already
                   identified our win themes and gaps. This will
                   save us 2-3 hours in the kickoff meeting."

Time to Review: 15 minutes (vs. 1+ hour manual RFP analysis)
```

**Proposal Kickoff Meeting - Same Day 2:00 PM**
```
Attendees:
- Emily (Proposal Manager)
- Jennifer (BD/Capture Lead)
- Tom (Technical Lead)
- Sarah (Proposal Writer)
- Lisa (Pricing Lead)

Emily shares screen from GovAI:

"Based on GovAI's analysis, here are our win themes:
 1. Recent DoD CIO experience (we have 2 contracts)
 2. CMMI Level 3 certification (competitor: only Level 2)
 3. Rapid delivery (our average: 6 weeks vs. industry 12 weeks)

Our gap: IL5 experience. Tom, can we partner with SecureCloud?"

Tom: "Yes, they have 5 IL5 contracts. I'll reach out today."

Emily: "Perfect. Sarah, start the outline using these discriminators.
        Lisa, pricing kickoff tomorrow?"

Lisa: "Yes, 10 AM. All the cost drivers are clear from the AI analysis."

Meeting Outcome:
- Clear win strategy established
- Gap mitigation plan agreed
- Proposal outline started
- Timeline confirmed: 43 days, sufficient

Meeting Duration: 45 minutes (vs. 2 hours typical)
Efficiency Gain: 60% time savings
Quality: Win strategy clearer, earlier in process
```

### Phase 3: Proposal Development (Weeks 3-4)

**Emily's Daily Workflow**
```
Morning Routine (15 minutes):
┌──────────────────────────────────────────────────┐
│ Emily's Dashboard - December 10, 2025            │
├──────────────────────────────────────────────────┤
│ Active Proposals (6):                            │
│                                                  │
│ [P1] DoD IT Modernization                       │
│      Status: Outline complete, writing started  │
│      Due: Jan 15 (36 days) ✓                   │
│      Next Milestone: Color review (Dec 18)      │
│      Completion: ████████░░░ 35%                │
│                                                  │
│ [P1] VA Cloud Infrastructure                     │
│      Status: Draft complete, in review          │
│      Due: Jan 20 (41 days) ✓                   │
│      Next Milestone: Red team (Dec 15)          │
│      Completion: ████████████░ 75%              │
│                                                  │
│ [P2] GSA Facilities Maintenance                  │
│      Status: Kickoff complete, researching      │
│      Due: Jan 8 (29 days) ⚠                    │
│      Next Milestone: Draft due (Dec 20)         │
│      Completion: ████░░░░░░░ 20%                │
│                                                  │
│ Today's Tasks:                                   │
│  ☐ Review VA Cloud draft (Tom's section)       │
│  ☐ DoD IT: Schedule SME interviews             │
│  ☐ GSA: Approve outline                        │
│  ☐ Weekly status report to Michael             │
│                                                  │
│ Alerts:                                          │
│  ⚠ VA Cloud red team in 5 days - confirm SMEs │
│  ⚠ DoD IT questions due in 8 days              │
└──────────────────────────────────────────────────┘

Emily's thoughts: "Everything on track. The color review
                   alerts give me plenty of notice to schedule.
                   No surprises today!"

Time: 15 minutes to review and prioritize day
Previous process: 45 minutes of email/spreadsheet archaeology
```

### Phase 4: Quality Assurance (Week 5)

**Color Team Review Preparation**
```
Emily's Preparation for DoD IT Color Review:

GovAI Compliance Checklist:
┌──────────────────────────────────────────────────┐
│ Proposal Compliance Check - DoD IT Modernization│
├──────────────────────────────────────────────────┤
│ RFP Requirements (Auto-extracted from Section L):│
│                                                  │
│ Volume 1 - Technical:                            │
│  ☑ Cover page with solicitation number          │
│  ☑ Table of contents with page numbers          │
│  ☑ Executive summary (2 pages max)              │
│  ☑ Technical approach (25 pages max)            │
│  ☑ Management approach (15 pages max)           │
│  ☑ Past performance (5 projects minimum)        │
│  ☐ Key personnel resumes (still need 2)         │
│  ☑ Organizational chart                         │
│                                                  │
│ Volume 2 - Pricing:                              │
│  ☑ Completed pricing spreadsheet                │
│  ☑ Cost narrative                                │
│  ☑ Labor rate justification                     │
│  ☐ Subcontractor quotes (need SecureCloud)      │
│                                                  │
│ Mandatory Clauses:                               │
│  ☑ FAR 52.219-1 (Small Business Concern)        │
│  ☑ FAR 52.203-18 (Prohibition on Contracting)   │
│  ☑ DFARS 252.204-7012 (Safeguarding Info)       │
│  ☑ All 23 other required clauses                │
│                                                  │
│ Page Count Check:                                │
│  Executive Summary: 2/2 pages ✓                 │
│  Technical Approach: 24/25 pages ✓              │
│  Management Approach: 14/15 pages ✓             │
│  Total Volume 1: 87/100 pages ✓                 │
│                                                  │
│ Outstanding Items (3):                           │
│  ⚠ Need 2 more key personnel resumes           │
│  ⚠ SecureCloud subcontractor quote pending     │
│  ⚠ Final compliance matrix review               │
│                                                  │
│ Risk Level: LOW (93% complete)                  │
│                                                  │
│ [Export Checklist] [Share with Team]            │
└──────────────────────────────────────────────────┘

Emily's Action:
- Sends reminder emails for 2 resumes
- Follows up with Lisa on SecureCloud quote
- Schedules compliance review for tomorrow

Compliance Prep Time: 20 minutes (vs. 2 hours manual RFP review)
Confidence Level: HIGH (nothing missed)
```

**Color Team Review Meeting**
```
Color Team provides feedback:

Emily captures notes in GovAI:
┌──────────────────────────────────────────────────┐
│ Color Team Feedback - DoD IT Modernization      │
│ Date: December 18, 2025                          │
├──────────────────────────────────────────────────┤
│ Strengths:                                       │
│  ✓ Win themes clearly articulated               │
│  ✓ Strong past performance narrative            │
│  ✓ Technical approach is innovative             │
│  ✓ Graphics are professional and compelling     │
│                                                  │
│ Areas for Improvement:                           │
│  • Executive summary needs more impact          │
│    - Add cost savings quantification            │
│    - Emphasize rapid delivery more prominently  │
│  • Management section too generic               │
│    - Tie back to customer's pain points         │
│    - Add more DoD-specific language             │
│  • Risk section light                           │
│    - Need more detailed mitigation strategies   │
│                                                  │
│ Actions Required:                                │
│  1. Sarah to revise exec summary (due: Dec 20)  │
│  2. Tom to strengthen management section (Dec 21)│
│  3. Emily to enhance risk section (Dec 19)      │
│                                                  │
│ Overall Assessment: STRONG - Address feedback   │
│                     and we're competitive       │
│                                                  │
│ Red Team Scheduled: December 28, 2025           │
└──────────────────────────────────────────────────┘

Result: All feedback documented and assigned
        Automatic reminders created for action items
        Red team auto-scheduled in calendar

Post-Color Work: 5 days of revisions
Red Team Date: Dec 28 (18 days before deadline)
Buffer: Comfortable cushion for final revisions
```

### Phase 5: Submission Success (Week 6)

**Final Submission Day - January 15, 2026**
```
Morning: Final Checks (9:00 AM - 11:00 AM)

Emily's Final Checklist:
┌──────────────────────────────────────────────────┐
│ Pre-Submission Checklist - DoD IT Modernization │
│ Deadline: Today, 2:00 PM ET                      │
├──────────────────────────────────────────────────┤
│ Document Preparation:                            │
│  ☑ All volumes complete and proofread           │
│  ☑ PDFs generated and checked                   │
│  ☑ File names match RFP requirements            │
│  ☑ File sizes within limits (25MB each)         │
│  ☑ Virus scan completed                         │
│                                                  │
│ Compliance Final Check:                          │
│  ☑ All pages numbered correctly                 │
│  ☑ All required signatures obtained             │
│  ☑ All certifications included                  │
│  ☑ Pricing matches technical volumes            │
│  ☑ SF1449 form completed                        │
│                                                  │
│ Submission Preparation:                          │
│  ☑ SAM.gov account active and valid             │
│  ☑ DUNS number verified                         │
│  ☑ Submission portal tested (dry run)           │
│  ☑ Backup upload plan ready                     │
│                                                  │
│ Team Notification:                               │
│  ☑ CEO review completed                         │
│  ☑ Pricing authorized by CFO                    │
│  ☑ BD team notified of submission plan          │
│  ☑ Legal review complete                        │
│                                                  │
│ All Green! Ready to Submit ✓                    │
│                                                  │
│ [Begin Upload Process]                           │
└──────────────────────────────────────────────────┘

Final Check Time: 45 minutes
Previous Process: 2-3 hours, often with last-minute surprises
Peace of Mind: HIGH - systematic process, nothing missed
```

**Submission Completed**
```
12:30 PM - Upload to SAM.gov complete
12:45 PM - Confirmation email received

Emily updates GovAI:
┌──────────────────────────────────────────────────┐
│ DoD Enterprise IT Modernization                  │
│ Status: SUBMITTED ✓                             │
├──────────────────────────────────────────────────┤
│ Submission Details:                              │
│  Date: January 15, 2026, 12:34 PM ET           │
│  Time to Deadline: 1 hour 26 minutes early     │
│  Confirmation #: SAM-2026-0045-A                │
│                                                  │
│ Proposal Metrics:                                │
│  Kickoff to Submission: 48 days                 │
│  Total Hours: 287 hours                         │
│  Cost: $42,150                                  │
│  Pages: 187 pages                               │
│  Team Members: 12                               │
│                                                  │
│ Post-Submission:                                 │
│  Award Expected: March 2026                     │
│  Notification Contact: Emily Washington         │
│  Win Probability (AI): 75%                      │
│                                                  │
│ Next Steps:                                      │
│  • Monitor for Q&A requests                     │
│  • Prepare for possible oral presentation       │
│  • Maintain team availability                   │
│                                                  │
│ [Generate Lessons Learned] [Archive Proposal]  │
└──────────────────────────────────────────────────┘

Emily sends celebration email to team: "Submitted at 12:34 PM!
                                       Great work everyone!"

Immediate Post-Submission:
- GovAI automatically moves to "Submitted" status
- Deadline reminders stop
- Award notification tracking begins
- Proposal archived for future reference
```

### Phase 6: Continuous Improvement (Month 3)

**Lessons Learned Analysis**
```
Emily reviews all proposals from past quarter:

GovAI Analytics:
┌──────────────────────────────────────────────────┐
│ Proposal Team Performance - Q4 2025              │
├──────────────────────────────────────────────────┤
│ EFFICIENCY METRICS:                              │
│  Proposals Submitted: 12                         │
│  Average Duration: 41 days (kickoff to submit)  │
│  Industry Benchmark: 52 days                     │
│  Improvement: 21% faster ✓                      │
│                                                  │
│ QUALITY METRICS:                                 │
│  Compliance Issues: 0                            │
│  Late Submissions: 0                             │
│  Missed Requirements: 0                          │
│  Color/Red Reviews: 100% completion             │
│                                                  │
│ TEAM METRICS:                                    │
│  Proposal Writer Utilization: 87%               │
│  SME Hours per Proposal: 18.4 hours             │
│  (vs. 24 hours previous quarter)                │
│  Team Satisfaction: 8.7/10                       │
│                                                  │
│ WIN RATE CORRELATION:                            │
│  Proposals with AI fit > 85: 4 wins / 6 = 67%  │
│  Proposals with AI fit 70-85: 2 wins / 4 = 50% │
│  Proposals with AI fit < 70: 0 wins / 2 = 0%   │
│                                                  │
│ KEY INSIGHTS:                                    │
│  • AI fit score is strong predictor of win     │
│  • Earlier kickoffs (on high scores) = better  │
│  • Compliance tracking eliminated late issues  │
│  • Time savings mostly from faster research    │
│                                                  │
│ RECOMMENDATIONS:                                 │
│  1. Set minimum fit score of 75 for pursuit    │
│  2. Initiate capture earlier on 85+ scores     │
│  3. Invest more in 90+ opportunities           │
└──────────────────────────────────────────────────┘

Emily shares with leadership:
"Our win rate on high-fit opportunities is 67%, double our overall
rate. GovAI is helping us focus resources on the right opportunities."
```

## Success Metrics

**After 6 Months with GovAI:**

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Efficiency** |
| Proposal kickoff time | 2 hours | 45 min | -62% |
| RFP analysis time | 4 hours | 1 hour | -75% |
| Compliance checking time | 3 hours | 30 min | -83% |
| Status reporting time | 2 hrs/week | 15 min/week | -88% |
| **Quality** |
| Late submissions | 2/year | 0 | -100% |
| Compliance issues | 3/year | 0 | -100% |
| Missed requirements | 4/year | 0 | -100% |
| Win rate | 19% | 28% | +47% |
| **Capacity** |
| Proposals/quarter | 10 | 15 | +50% |
| Concurrent proposals | 3-4 | 5-6 | +50% |
| Team overtime | 15% | 5% | -67% |
| Writer burnout | High | Low | Major |

## Emily's Testimonial

> "GovAI transformed how we manage proposals. I used to spend half my day tracking down information, chasing people, and worrying about what I might have missed. Now everything is in one place with automatic reminders. The AI analysis gives us a head start on win themes, and the compliance checking is a game-changer - we haven't had a single non-compliant proposal in 6 months. Most importantly, my team is happier. We can handle 50% more proposals without overtime or burnout. That's not just efficiency, that's better quality of life."
>
> **— Emily Washington, Proposal Manager, Federal Solutions Group**

## Key Benefits for Proposal Managers

1. **No Surprises**: Early visibility into upcoming proposals
2. **Systematic Process**: Compliance and quality built-in
3. **Team Coordination**: Everyone sees status in real-time
4. **Time Savings**: 60-80% reduction in administrative tasks
5. **Quality Assurance**: Zero compliance issues
6. **Capacity Growth**: Handle more proposals with same team
7. **Reduced Stress**: Automated tracking, reminders, and checklists
