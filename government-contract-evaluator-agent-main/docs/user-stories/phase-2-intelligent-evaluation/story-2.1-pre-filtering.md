# Story 2.1: Rule-Based Pre-Filtering

## User Story
```
AS the system
I WANT to pre-filter opportunities before expensive GPT-4 evaluation
SO THAT I only spend money on relevant opportunities
```

## Background
Many opportunities can be ruled out without AI:
- Deadline too soon (can't prepare a bid in time)
- Contract value outside company's typical range
- Set-aside type doesn't match certifications
- Geographic location doesn't match preferences

These checks are FREE and can eliminate 30-50% of opportunities before AI evaluation.

## Acceptance Criteria

### AC1: Deadline Filter
- [ ] Skip opportunities with deadline < 7 days from now
- [ ] Configurable threshold (some companies may want 14 days minimum)
- [ ] Log skipped opportunities with reason

### AC2: Contract Value Filter
- [ ] Compare opportunity's estimated value to company's preferred range
- [ ] Skip if value is 10x above or below company's range
- [ ] Handle opportunities with no estimated value (don't skip)

### AC3: Set-Aside Filter
- [ ] If opportunity has set-aside requirement (8(a), WOSB, SDVOSB, HUBZone, etc.)
- [ ] Skip if company doesn't have matching certification
- [ ] Non-set-aside opportunities pass this filter

### AC4: Geographic Filter
- [ ] If opportunity specifies place of performance
- [ ] Skip if company's geographic preferences don't include that location
- [ ] Companies with "Nationwide" preference pass all geographic checks

### AC5: Filter Results Tracking
- [ ] Track why each opportunity was filtered
- [ ] Store filter results for debugging
- [ ] Return counts: passed, filtered_deadline, filtered_value, filtered_setaside, filtered_geo

## Technical Design

### New File: `opportunity_filter.py`

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from app.models.opportunity import Opportunity
from app.models.company import Company

@dataclass
class FilterResult:
    passed: bool
    reason: Optional[str] = None
    filter_name: Optional[str] = None

class OpportunityFilter:
    def __init__(self, min_days_to_deadline: int = 7):
        self.min_days_to_deadline = min_days_to_deadline

    def filter_opportunity(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """
        Apply all filters to an opportunity for a specific company.
        Returns FilterResult indicating if opportunity should be evaluated.
        """
        # Check deadline
        result = self._check_deadline(opportunity)
        if not result.passed:
            return result

        # Check contract value
        result = self._check_contract_value(opportunity, company)
        if not result.passed:
            return result

        # Check set-aside
        result = self._check_set_aside(opportunity, company)
        if not result.passed:
            return result

        # Check geography
        result = self._check_geography(opportunity, company)
        if not result.passed:
            return result

        return FilterResult(passed=True)

    def _check_deadline(self, opportunity: Opportunity) -> FilterResult:
        """Filter out opportunities with deadlines too soon."""
        if not opportunity.response_deadline:
            return FilterResult(passed=True)  # No deadline = don't filter

        days_until_deadline = (opportunity.response_deadline - datetime.utcnow()).days

        if days_until_deadline < self.min_days_to_deadline:
            return FilterResult(
                passed=False,
                reason=f"Deadline too soon: {days_until_deadline} days",
                filter_name="deadline"
            )
        return FilterResult(passed=True)

    def _check_contract_value(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out opportunities outside company's value range."""
        if not opportunity.award_amount or not company.contract_value_range:
            return FilterResult(passed=True)  # No data = don't filter

        value = opportunity.award_amount
        company_range = company.contract_value_range

        # Define ranges (these could be in config)
        ranges = {
            "Micro ($0 - $100K)": (0, 100_000),
            "Small ($100K - $1M)": (100_000, 1_000_000),
            "Medium ($1M - $10M)": (1_000_000, 10_000_000),
            "Large ($10M - $50M)": (10_000_000, 50_000_000),
            "Enterprise ($50M+)": (50_000_000, float('inf'))
        }

        if company_range not in ranges:
            return FilterResult(passed=True)

        min_val, max_val = ranges[company_range]

        # Allow 10x flexibility on either end
        if value < min_val / 10 or value > max_val * 10:
            return FilterResult(
                passed=False,
                reason=f"Contract value ${value:,.0f} outside company's range",
                filter_name="contract_value"
            )
        return FilterResult(passed=True)

    def _check_set_aside(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out set-aside opportunities if company lacks certification."""
        if not opportunity.set_aside_type:
            return FilterResult(passed=True)  # No set-aside = open to all

        company_certs = company.certifications or []

        # Map set-aside types to required certifications
        set_aside_map = {
            "8(a)": ["8(a)"],
            "WOSB": ["WOSB", "EDWOSB"],
            "EDWOSB": ["EDWOSB"],
            "SDVOSB": ["SDVOSB"],
            "VOSB": ["VOSB", "SDVOSB"],
            "HUBZone": ["HUBZone"],
            "SBA": ["8(a)", "HUBZone", "WOSB", "SDVOSB"],  # Any SBA cert
        }

        required_certs = set_aside_map.get(opportunity.set_aside_type, [])

        if required_certs and not any(cert in company_certs for cert in required_certs):
            return FilterResult(
                passed=False,
                reason=f"Missing certification for {opportunity.set_aside_type} set-aside",
                filter_name="set_aside"
            )
        return FilterResult(passed=True)

    def _check_geography(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out opportunities outside company's geographic preferences."""
        company_geo = company.geographic_preferences or []

        # Nationwide = accept all
        if "Nationwide" in company_geo or not company_geo:
            return FilterResult(passed=True)

        opp_location = opportunity.place_of_performance
        if not opp_location:
            return FilterResult(passed=True)  # No location = don't filter

        # Check if opportunity location matches any company preference
        # This is simplified - could be enhanced with state abbreviation matching
        if not any(geo.lower() in opp_location.lower() for geo in company_geo):
            return FilterResult(
                passed=False,
                reason=f"Location '{opp_location}' not in company's preferences",
                filter_name="geography"
            )
        return FilterResult(passed=True)


# Singleton instance
opportunity_filter = OpportunityFilter()
```

### Integration with Discovery

```python
from app.services.opportunity_filter import opportunity_filter, FilterResult

def discover_opportunities():
    # ... fetch opportunities ...

    filter_stats = {
        'passed': 0,
        'filtered_deadline': 0,
        'filtered_value': 0,
        'filtered_setaside': 0,
        'filtered_geo': 0
    }

    for opportunity in opportunities:
        for company in companies:
            result = opportunity_filter.filter_opportunity(opportunity, company)

            if not result.passed:
                filter_stats[f'filtered_{result.filter_name}'] += 1
                logger.debug(f"Filtered {opportunity.notice_id}: {result.reason}")
                continue

            filter_stats['passed'] += 1
            # Proceed to AI evaluation...

    logger.info(f"Filter results: {filter_stats}")
```

## Testing

### Unit Tests
- [ ] Test deadline filter with various dates
- [ ] Test contract value filter with edge cases
- [ ] Test set-aside filter with all certification types
- [ ] Test geography filter with state matching

### Integration Tests
- [ ] Run filter on sample opportunities
- [ ] Verify filter stats are accurate
- [ ] Verify filtered opportunities are not evaluated

## Definition of Done
- [ ] OpportunityFilter class implemented
- [ ] All filter methods tested
- [ ] Integrated into discovery script
- [ ] Filter stats logged
- [ ] Deployed and verified
