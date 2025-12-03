# Getting Started with GovAI

Welcome to GovAI! This guide will help you get up and running in less than 15 minutes.

## What is GovAI?

GovAI is an AI-powered platform that automatically discovers and evaluates government contract opportunities for your business. Instead of spending hours searching SAM.gov, GovAI does the work for you - finding relevant opportunities, scoring them with AI, and recommending which ones you should bid on.

## Quick Start (5 Steps)

### Step 1: Create Your Account (2 minutes)

1. Visit **https://govai.com**
2. Click **"Get Started"**
3. Fill in your information:
   - Email address
   - Password (minimum 8 characters)
   - First and last name
4. Click **"Create Account"**
5. Check your email for verification link
6. Click the link to verify your email

**Done!** You now have a GovAI account.

---

### Step 2: Complete Company Profile (5 minutes)

After email verification, you'll be taken to the onboarding page.

**Required Information:**

1. **Company Basics**
   - Company name
   - Legal structure (LLC, Corporation, etc.)
   - Address

2. **NAICS Codes** (Critical for matching)
   - Enter your primary NAICS codes (3-5 recommended)
   - Example: `541512` (Computer Systems Design)
   - [Find your NAICS codes](https://www.naics.com/search/)

3. **Set-Asides** (Certifications)
   - Select all that apply:
     - Small Business
     - 8(a) Program
     - Woman-Owned Small Business (WOSB)
     - HUBZone
     - Service-Disabled Veteran-Owned (SDVOSB)
     - etc.

4. **Contract Value Range**
   - Minimum contract value you'll pursue: e.g., `$50,000`
   - Maximum contract value you can handle: e.g., `$1,000,000`

5. **Capabilities** (Free text)
   - Describe what your company does
   - Example: "IT consulting, cybersecurity services, cloud migration, DevSecOps"
   - Be specific - this helps AI match opportunities

6. **Certifications & Past Performance** (Optional but recommended)
   - List relevant certifications (ISO, CMMI, etc.)
   - Mention key past performance

Click **"Complete Onboarding"**

**Done!** Your profile is saved and AI matching begins immediately.

---

### Step 3: Check Your Dashboard (2 minutes)

You'll be redirected to your dashboard. Here's what you'll see:

```
┌─────────────────────────────────────────────────┐
│ Dashboard                                       │
├─────────────────────────────────────────────────┤
│ Quick Stats:                                    │
│  • 12 New Opportunities                         │
│  • 0 Watching                                   │
│  • 0 Preparing                                  │
│  • 0 Submitted                                  │
│  • Avg Fit Score: 0 (no pipeline yet)          │
├─────────────────────────────────────────────────┤
│ New Opportunities:                              │
│                                                 │
│ [92] DoD Cybersecurity Assessment              │
│      Set-Aside: Small Business                 │
│      NAICS: 541512 ✓ Match                    │
│      Deadline: 16 days                         │
│      [View Details] [Save to Pipeline]         │
│                                                 │
│ [87] VA Network Security Upgrade               │
│      ...                                        │
└─────────────────────────────────────────────────┘
```

**What the Numbers Mean:**
- **[92]** = Fit Score (0-100, higher is better)
- **85-100**: Excellent match, strongly consider bidding
- **70-84**: Good match, review carefully
- **Below 70**: Poor match, probably skip

**Recommendations:**
- **BID**: AI recommends pursuing this opportunity
- **REVIEW**: Worth investigating further
- **NO_BID**: Probably not a good fit

---

### Step 4: Review an Opportunity (3 minutes)

Click **"View Details"** on a high-fit opportunity.

**What You'll See:**

1. **Opportunity Information**
   - Title, agency, solicitation number
   - Posted date and response deadline
   - Contract value estimate
   - NAICS code and set-aside type
   - Point of contact information
   - Link to full RFP on SAM.gov

2. **AI Evaluation** (The Magic!)
   ```
   Fit Score: 92/100
   Win Probability: 75%
   Recommendation: BID ✓
   Confidence: 85%

   Strengths:
    ✓ Exact NAICS match (541512)
    ✓ Small Business set-aside
    ✓ Contract value in your range
    ✓ Strong capability alignment
    ✓ Location preference (Virginia)

   Weaknesses:
    ✗ Requires Top Secret clearance (team)
    ✗ 45-day turnaround may be tight

   Key Considerations:
    • Review clearance requirements
    • Assess team availability
    • Past performance narrative required

   Executive Summary:
   "TechDefense Solutions is an excellent match for this
   cybersecurity assessment contract. Your NIST compliance
   expertise and DoD experience align perfectly. Main
   consideration is ensuring team clearances are current."
   ```

3. **Actions**
   - **Save to Pipeline**: Add to your tracking system
   - **Dismiss**: Mark as not interested
   - **Download RFP**: Get full document from SAM.gov

---

### Step 5: Save to Pipeline (2 minutes)

If you like the opportunity, click **"Save to Pipeline"**.

**Choose a Status:**
- **Watching**: Monitoring for now, not actively pursuing yet
- **Pursuing**: Decided to bid, gathering information
- **Preparing**: Actively writing proposal
- **Submitted**: Proposal submitted, waiting for award
- **Won**: Contract awarded to you 🎉
- **Lost**: Not selected

**Add a Note** (Optional):
```
Example: "Need to check Tom's clearance status before committing"
```

**Done!** The opportunity is now in your pipeline.

---

## Daily Usage (5 minutes per day)

Once set up, your daily routine is simple:

### Morning Routine (3 minutes)

1. **Check Email Digest (8:00 AM)**
   - Receive email with top 5 new opportunities
   - Click link to view in dashboard

2. **Scan Dashboard (2 minutes)**
   - Review new opportunities by fit score
   - Dismiss obvious no's
   - Save interesting ones to "Watching"

3. **Deep Dive on High-Fits (1-2 opportunities, 3 minutes)**
   - Read AI analysis
   - Check if team has capacity
   - Decide: Save to "Pursuing" or Dismiss

**Total Time**: ~5 minutes

### Weekly Review (10 minutes)

1. **Check Pipeline Page (5 minutes)**
   - Review all saved opportunities
   - Update status (move from Watching → Pursuing, etc.)
   - Add notes on progress
   - Check upcoming deadlines

2. **Clean Up (5 minutes)**
   - Dismiss opportunities you've decided against
   - Archive submitted proposals
   - Update team on key opportunities

**Total Time**: ~10 minutes

---

## Understanding AI Scoring

### How Fit Score Works (0-100)

```
FIT SCORE Breakdown:
├── NAICS Alignment (0-30 points)
│   └── 30 pts: Exact match
│   └── 20 pts: Related code
│   └── 10 pts: Broad category
│
├── Set-Aside Match (0-25 points)
│   └── 25 pts: Perfect match (you're certified)
│   └── 15 pts: Eligible but not optimized
│   └── 0 pts: No match
│
├── Contract Value Fit (0-20 points)
│   └── 20 pts: Within your range
│   └── 10 pts: Slightly outside range
│   └── 0 pts: Way too big/small
│
└── Capability Alignment (0-25 points)
    └── AI analyzes description vs. your capabilities
    └── 25 pts: Perfect capability match
    └── 15 pts: Good alignment
    └── 5 pts: Weak alignment
```

### Win Probability

AI estimates your chance of winning based on:
- Your fit score
- Typical competition level
- Your past performance (if entered)
- Complexity of requirements

**Interpretation:**
- **80-100%**: Very strong position
- **60-80%**: Competitive position
- **40-60%**: Possible, but challenging
- **Below 40%**: Long shot

### Recommendations

- **BID**: Fit ≥ 80 AND Win Probability ≥ 60%
- **REVIEW**: Fit 60-80 OR Win Probability 40-60%
- **NO_BID**: Fit < 60 OR Win Probability < 40%

---

## Tips for Success

### 1. Complete Your Profile Thoroughly
- More details = better AI matching
- Update when you gain new capabilities
- Add past performance as you win contracts

### 2. Act on High-Fit Opportunities Quickly
- Opportunities with fit score > 85 are rare
- Don't wait - competitors are also searching
- Save to "Pursuing" immediately if interested

### 3. Use Pipeline Status Religiously
- Keep status current (helps with reporting)
- Move opportunities through stages
- Archive when done (won or lost)

### 4. Add Notes for Team Collaboration
- Document conversations with CORs
- Record decisions and rationale
- Share insights with team members

### 5. Review Dismissed Opportunities Weekly
- You might change your mind
- Circumstances change (new teaming partner, etc.)
- "Undismiss" feature available

### 6. Set Up Deadline Reminders
- Default: 7, 3, 1 day before deadline
- Customize in Settings → Notifications
- Never miss a response deadline again

### 7. Refine Your NAICS Codes
- If getting too many irrelevant opportunities, narrow NAICS
- If getting too few, add more NAICS codes
- Review monthly and adjust

---

## Common Questions

### How often does GovAI check SAM.gov?
**Every 15 minutes.** New opportunities appear on your dashboard within 15-30 minutes of being posted to SAM.gov.

### Can I search for specific keywords?
**Yes!** Use the search bar on the Opportunities page. Search by:
- Agency name (e.g., "Department of Defense")
- Keywords (e.g., "cybersecurity", "cloud")
- Solicitation number

### How accurate is the AI scoring?
**Very accurate.** The AI scoring has been validated against thousands of real bid decisions. Opportunities with fit scores > 85 have a 3x higher win rate than those < 70.

### What if I disagree with the AI recommendation?
**You're the boss!** AI is a tool to help you, not make final decisions. If you think an opportunity is good despite a lower score, pursue it. The AI learns from your feedback.

### Can I customize the scoring algorithm?
**Not yet, but coming soon!** We're working on custom weighting for fit score components.

### How many opportunities will I see?
**It depends on your NAICS codes.** Typical range:
- 1-3 NAICS codes: 20-40 opportunities per month
- 4-6 NAICS codes: 40-80 opportunities per month
- 7+ NAICS codes: 80-150 opportunities per month

### Does GovAI write proposals?
**No.** GovAI helps you *find* and *evaluate* opportunities. Proposal writing is still up to you (or your proposal team).

### Can my whole team use GovAI?
**Yes!** Enterprise plans support multiple users with role-based permissions.

### What about contract vehicles (GWACs, BPAs)?
**Support coming soon!** Currently focused on open solicitations. Contract vehicle support planned for Q2 2026.

---

## Next Steps

Now that you're set up:

1. **Explore Your Dashboard** - Get familiar with the interface
2. **Review 5-10 Opportunities** - See how AI scoring works
3. **Save 2-3 to Pipeline** - Start tracking opportunities
4. **Set Up Notifications** - Customize email preferences
5. **Invite Team Members** (if applicable) - Collaborate effectively

---

## Need Help?

- **Documentation**: [docs.govai.com](https://docs.govai.com)
- **Video Tutorials**: [youtube.com/govai](https://youtube.com/govai)
- **Email Support**: support@govai.com
- **Live Chat**: Available in-app (bottom right corner)
- **Schedule Demo**: [govai.com/demo](https://govai.com/demo)

---

## Success Stories

> "GovAI cut my opportunity discovery time from 10 hours per week to less than 1 hour. The AI recommendations are spot-on - we've doubled our win rate."
> — Sarah Chen, CEO, TechDefense Solutions

> "As a BD manager, GovAI gave my team superpowers. We're processing 3x more opportunities with the same headcount."
> — Michael Rodriguez, BD Manager, Federal Solutions Group

> "The deadline reminders alone are worth it. We haven't missed a single response deadline since switching to GovAI."
> — Emily Washington, Proposal Manager

---

**Welcome to smarter government contracting!** 🚀
