# User Story: Dynamic Re-scoring on Profile Changes

## Overview

**Feature**: Dynamic Re-calculation of Scores When Business Profile Changes
**Requirement Reference**: Requirement #4 from AI_Procurement_Platform_Updated_Requirements.docx.md
**Status**: ✅ IMPLEMENTED (2024-12-23)
**Priority**: LOW
**Estimated Effort**: 1 week

> **Implementation Notes:**
> - Database migration: `007_add_profile_versioning.py`
> - Service: `app/services/rescoring.py`
> - API: `app/api/v1/evaluations.py`
> - Schemas: `app/schemas/rescoring.py`
> - Profile version tracking added to Company and Evaluation models

---

## Business Value

### Current State
- Opportunities are evaluated when first viewed (lazy evaluation)
- Evaluations are cached and reused
- When a company updates their profile (NAICS codes, certifications, capabilities), existing evaluations are NOT automatically re-calculated
- Users must manually trigger re-evaluation or wait for new opportunities

### Target State
- Profile changes trigger automatic re-scoring of relevant cached evaluations
- Users see updated scores immediately after profile changes
- Historical evaluations marked as "stale" and refreshed on next view
- Option to manually trigger bulk re-evaluation

### ROI Impact
- **User Experience**: Scores always reflect current profile
- **Accuracy**: Prevents showing outdated recommendations
- **Trust**: Users see platform responding to their profile changes

---

## User Stories

### US-RESCORE-1: Automatic Re-scoring on Profile Update

**As a** business user who updated my company profile
**I want to** see my opportunity scores automatically updated
**So that** recommendations reflect my current capabilities and certifications

**Acceptance Criteria:**
- [ ] Profile save triggers background re-scoring job
- [ ] User sees "Updating scores..." notification
- [ ] Scores update within 5 minutes of profile change
- [ ] Only affected evaluations are recalculated (same NAICS, etc.)
- [ ] Notification when re-scoring complete

**Technical Approach:**
```python
# In company update endpoint
@router.put("/")
async def update_company(company_data: CompanyUpdate, db: Session, current_user: User):
    # Update company
    updated_company = company_service.update(db, current_user.company_id, company_data)

    # Check if scoring-relevant fields changed
    if scoring_fields_changed(old_company, updated_company):
        # Queue re-scoring task
        rescore_evaluations_task.delay(company_id=updated_company.id)

    return updated_company


def scoring_fields_changed(old: Company, new: Company) -> bool:
    """Check if fields affecting scoring have changed"""
    return (
        old.naics_codes != new.naics_codes or
        old.set_asides != new.set_asides or
        old.geographic_preferences != new.geographic_preferences or
        old.contract_value_min != new.contract_value_min or
        old.contract_value_max != new.contract_value_max or
        old.capabilities != new.capabilities
    )
```

---

### US-RESCORE-2: Stale Evaluation Indicator

**As a** user viewing an opportunity
**I want to** know if my evaluation is based on an old profile version
**So that** I can request a fresh evaluation if needed

**Acceptance Criteria:**
- [ ] Evaluations track profile version they were created against
- [ ] If profile has changed since evaluation, show "Based on old profile" warning
- [ ] "Refresh Evaluation" button available
- [ ] Clicking refresh triggers immediate re-evaluation

**UI Wireframe:**
```
+----------------------------------------------------------+
|  AI Evaluation                                             |
+----------------------------------------------------------+
|  Fit Score: 72%                                           |
|  Win Probability: 55%                                     |
|  Recommendation: BID                                      |
|                                                            |
|  [!] This evaluation was based on your old profile.       |
|      Your NAICS codes have changed since then.            |
|      [Refresh Evaluation]                                  |
|                                                            |
+----------------------------------------------------------+
```

---

### US-RESCORE-3: Bulk Re-evaluation Option

**As a** power user who made significant profile changes
**I want to** re-evaluate all my saved opportunities at once
**So that** my entire pipeline reflects updated scores

**Acceptance Criteria:**
- [ ] Settings page has "Re-evaluate All Opportunities" button
- [ ] Confirmation dialog explains cost/time
- [ ] Progress indicator shows re-evaluation status
- [ ] Notification when complete
- [ ] Rate limited to prevent abuse (max 1/hour)

**UI Wireframe:**
```
+----------------------------------------------------------+
|  Settings - AI Evaluation                                  |
+----------------------------------------------------------+
|                                                            |
|  Re-evaluate Opportunities                                 |
|  +------------------------------------------------------+  |
|  | Your profile has changed since some opportunities    |  |
|  | were evaluated. You can refresh all evaluations.     |  |
|  |                                                      |  |
|  | Opportunities to re-evaluate: 23                     |  |
|  | Estimated time: ~2 minutes                           |  |
|  |                                                      |  |
|  | [Re-evaluate All Opportunities]                      |  |
|  +------------------------------------------------------+  |
|                                                            |
|  Last bulk re-evaluation: 2024-12-15 at 3:45 PM           |
|                                                            |
+----------------------------------------------------------+
```

---

### US-RESCORE-4: Profile Version Tracking

**As a** platform system
**I want to** track profile versions for each evaluation
**So that** I can identify stale evaluations

**Acceptance Criteria:**
- [ ] Company table has profile_version column (increments on change)
- [ ] Evaluation table stores profile_version_at_evaluation
- [ ] Query can identify evaluations needing refresh
- [ ] Version comparison is fast and efficient

**Data Model Changes:**
```python
# Add to Company model
class Company(Base):
    # ... existing fields ...
    profile_version = Column(Integer, default=1, nullable=False)


# Add to Evaluation model
class Evaluation(Base):
    # ... existing fields ...
    profile_version_at_evaluation = Column(Integer, nullable=True)

    @property
    def is_stale(self) -> bool:
        """Check if evaluation is based on old profile"""
        if not self.profile_version_at_evaluation:
            return True  # Legacy evaluation
        return self.profile_version_at_evaluation < self.company.profile_version
```

---

## API Endpoints

```
POST   /api/v1/evaluations/rescore-all      - Trigger bulk re-scoring for company
GET    /api/v1/evaluations/stale-count      - Get count of stale evaluations
POST   /api/v1/evaluations/{id}/refresh     - Refresh single evaluation
GET    /api/v1/company/profile-version      - Get current profile version
```

---

## Database Migrations

```sql
-- Migration: Add profile versioning
ALTER TABLE companies ADD COLUMN profile_version INTEGER DEFAULT 1 NOT NULL;

ALTER TABLE evaluations ADD COLUMN profile_version_at_evaluation INTEGER;

-- Create index for stale evaluation queries
CREATE INDEX idx_evaluations_profile_version
ON evaluations(company_id, profile_version_at_evaluation);

-- Backfill existing evaluations (mark as needing refresh)
UPDATE evaluations SET profile_version_at_evaluation = 0
WHERE profile_version_at_evaluation IS NULL;
```

---

## Background Task Implementation

```python
# tasks/rescore.py

from celery import shared_task
from app.core.database import SessionLocal
from app.models.company import Company
from app.models.evaluation import Evaluation
from app.services.ai_evaluator import ai_evaluator_service

@shared_task
def rescore_evaluations_task(company_id: str):
    """
    Re-score all stale evaluations for a company.
    Triggered when company profile is updated.
    """
    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return {"error": "Company not found"}

        # Find stale evaluations
        stale_evaluations = db.query(Evaluation).filter(
            Evaluation.company_id == company_id,
            Evaluation.profile_version_at_evaluation < company.profile_version
        ).all()

        rescored = 0
        errors = 0

        for evaluation in stale_evaluations:
            try:
                # Re-evaluate
                new_eval = await ai_evaluator_service.evaluate_opportunity(
                    evaluation.opportunity,
                    company
                )

                # Update evaluation
                evaluation.fit_score = new_eval.get("fit_score")
                evaluation.win_probability = new_eval.get("win_probability")
                evaluation.recommendation = new_eval.get("recommendation")
                evaluation.strengths = new_eval.get("strengths")
                evaluation.weaknesses = new_eval.get("weaknesses")
                evaluation.reasoning = new_eval.get("reasoning")
                evaluation.profile_version_at_evaluation = company.profile_version
                evaluation.evaluated_at = datetime.utcnow()

                rescored += 1
            except Exception as e:
                errors += 1
                logger.error(f"Error rescoring evaluation {evaluation.id}: {e}")

        db.commit()

        return {
            "rescored": rescored,
            "errors": errors,
            "total": len(stale_evaluations)
        }

    finally:
        db.close()
```

---

## Testing Requirements

### E2E Test Cases to Add

| Test ID | Scenario | Steps |
|---------|----------|-------|
| TC-RESCORE-1 | Profile update triggers re-scoring | Update NAICS → Verify background task queued |
| TC-RESCORE-2 | Stale indicator shown | Update profile → View old evaluation → Verify warning shown |
| TC-RESCORE-3 | Manual refresh evaluation | Click "Refresh Evaluation" → Verify new scores |
| TC-RESCORE-4 | Bulk re-evaluation | Click "Re-evaluate All" → Verify all updated |
| TC-RESCORE-5 | Non-scoring changes don't trigger | Update company name only → Verify no re-scoring |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Re-scoring completion time | < 5 minutes for typical company |
| Stale evaluation rate | < 10% at any time |
| User-triggered refreshes | Decrease over time (auto should handle) |

---

## Dependencies

- Celery worker running for background tasks
- Profile version tracking in database
- OpenAI API availability for re-evaluation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| High API costs from frequent re-scoring | MEDIUM | Rate limit, only rescore on significant changes |
| User confusion about stale scores | LOW | Clear UI indicator, one-click refresh |
| Background task failures | LOW | Retry mechanism, error logging, manual fallback |
