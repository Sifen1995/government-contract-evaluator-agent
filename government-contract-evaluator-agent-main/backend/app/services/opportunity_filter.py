"""
Opportunity filtering service for pre-filtering before AI evaluation.
Uses rule-based logic to eliminate obviously irrelevant opportunities.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from app.models.opportunity import Opportunity
from app.models.company import Company
import logging

from backend.app.services import opportunity

logger = logging.getLogger(__name__)


@dataclass
class FilterResult:
    """Result of filtering an opportunity for a company."""
    passed: bool
    reason: Optional[str] = None
    filter_name: Optional[str] = None


@dataclass
class FilterStats:
    """Statistics from filtering a batch of opportunities."""
    total: int = 0
    passed: int = 0
    filtered_deadline: int = 0
    filtered_value: int = 0
    filtered_setaside: int = 0
    filtered_geography: int = 0
    filtered_naics: int = 0

    def to_dict(self) -> Dict:
        return {
            'total': self.total,
            'passed': self.passed,
            'filtered_deadline': self.filtered_deadline,
            'filtered_value': self.filtered_value,
            'filtered_setaside': self.filtered_setaside,
            'filtered_geography': self.filtered_geography,
            'filtered_naics': self.filtered_naics,
            'filter_rate': f"{((self.total - self.passed) / self.total * 100):.1f}%" if self.total > 0 else "0%"
        }


class OpportunityFilter:
    """
    Filter opportunities using rule-based logic before expensive AI evaluation.

    This eliminates obviously irrelevant opportunities:
    - Deadline too soon (not enough time to bid)
    - Contract value way outside company's range
    - Set-aside requirements company can't meet
    - Geographic locations company doesn't serve
    """

    # Contract value ranges (name -> (min, max))
    VALUE_RANGES = {
        "Micro ($0 - $100K)": (0, 100_000),
        "Small ($100K - $1M)": (100_000, 1_000_000),
        "Medium ($1M - $10M)": (1_000_000, 10_000_000),
        "Large ($10M - $50M)": (10_000_000, 50_000_000),
        "Enterprise ($50M+)": (50_000_000, float('inf'))
    }

    # Set-aside types and required certifications
    SETASIDE_CERT_MAP = {
        "8(a)": ["8(a)"],
        "8AN": ["8(a)"],
        "WOSB": ["WOSB", "EDWOSB"],
        "EDWOSB": ["EDWOSB"],
        "SDVOSB": ["SDVOSB"],
        "VOSB": ["VOSB", "SDVOSB"],
        "HUBZone": ["HUBZone"],
        "HUBZ": ["HUBZone"],
        "SBA": ["8(a)", "HUBZone", "WOSB", "EDWOSB", "SDVOSB"],  # Any SBA cert
        "Small Business": [],  # Any small business can bid
        "SB": [],
    }

    def __init__(self, min_days_to_deadline: int = 7, value_flexibility: float = 10.0):
        """
        Initialize filter with configuration.

        Args:
            min_days_to_deadline: Minimum days before deadline to consider opportunity
            value_flexibility: Multiplier for value range flexibility (e.g., 10 = 10x range)
        """
        self.min_days_to_deadline = min_days_to_deadline
        self.value_flexibility = value_flexibility

    def filter_opportunity(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """
        Apply all filters to an opportunity for a specific company.

        Args:
            opportunity: Opportunity to filter
            company: Company to match against

        Returns:
            FilterResult indicating if opportunity should be evaluated
        """

        if opportunity.evaluation_status == "evaluated":
          return FilterResult(
                passed=False,
                reason="Already evaluated",
                filter_name="evaluation"
            )
        if opportunity.is_forecast:
          return FilterResult(
                passed=False,
                reason="Forecast opportunity",
                filter_name="forecast"
       )
        
        if opportunity.source in ("dc_ocp", "dc_independent"):
           if opportunity.response_deadline:
              days_left = (opportunity.response_deadline - datetime.utcnow()).days
              if days_left < 2:
                  return FilterResult(
                    passed=False,
                    reason="DC opportunity deadline too close",
                    filter_name="deadline"
            )
        # Check NAICS match first (most common filter)
        result = self._check_naics(opportunity, company)
        if not result.passed:
            return result

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

    def filter_batch(
        self,
        opportunities: List[Opportunity],
        company: Company
    ) -> tuple[List[Opportunity], FilterStats]:
        """
        Filter a batch of opportunities for a company.

        Args:
            opportunities: List of opportunities to filter
            company: Company to match against

        Returns:
            Tuple of (passed_opportunities, filter_stats)
        """
        stats = FilterStats(total=len(opportunities))
        passed = []

        for opp in opportunities:
            result = self.filter_opportunity(opp, company)

            if result.passed:
                stats.passed += 1
                passed.append(opp)
            else:
                # Track which filter caught it
                if result.filter_name == 'naics':
                    stats.filtered_naics += 1
                elif result.filter_name == 'deadline':
                    stats.filtered_deadline += 1
                elif result.filter_name == 'contract_value':
                    stats.filtered_value += 1
                elif result.filter_name == 'set_aside':
                    stats.filtered_setaside += 1
                elif result.filter_name == 'geography':
                    stats.filtered_geography += 1

        logger.info(f"Filtered {stats.total} opportunities: {stats.passed} passed, {stats.to_dict()}")
        return passed, stats

    def _check_naics(self, opportunity: Opportunity, company: Company) -> FilterResult:
        """Check if opportunity's NAICS code matches company's codes."""
        company_naics = company.naics_codes or []

        if not company_naics:
            return FilterResult(passed=True)  # No NAICS = accept all

        opp_naics = opportunity.naics_code

        if not opp_naics:
            return FilterResult(passed=True)  # No NAICS on opportunity = accept

        if opp_naics in company_naics:
            return FilterResult(passed=True)

        # Check for partial match (first 4 digits)
        opp_prefix = opp_naics[:4] if len(opp_naics) >= 4 else opp_naics
        for comp_naics in company_naics:
            if comp_naics.startswith(opp_prefix) or opp_prefix.startswith(comp_naics[:4]):
                return FilterResult(passed=True)

        return FilterResult(
            passed=False,
            reason=f"NAICS {opp_naics} doesn't match company's codes",
            filter_name="naics"
        )

    def _check_deadline(self, opportunity: Opportunity) -> FilterResult:
        """Filter out opportunities with deadlines too soon."""
        if not opportunity.response_deadline:
            return FilterResult(passed=True)  # No deadline = don't filter

        # Handle timezone-aware vs naive datetimes
        deadline = opportunity.response_deadline
        if deadline.tzinfo:
            deadline = deadline.replace(tzinfo=None)

        days_until_deadline = (deadline - datetime.utcnow()).days

        if days_until_deadline < 0:
            return FilterResult(
                passed=False,
                reason=f"Deadline has passed ({abs(days_until_deadline)} days ago)",
                filter_name="deadline"
            )

        if days_until_deadline < self.min_days_to_deadline:
            return FilterResult(
                passed=False,
                reason=f"Deadline too soon: {days_until_deadline} days (min: {self.min_days_to_deadline})",
                filter_name="deadline"
            )

        return FilterResult(passed=True)

    def _check_contract_value(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out opportunities outside company's value range."""
        # Get opportunity value
        opp_value = None
        if hasattr(opportunity, 'estimated_value_high') and opportunity.estimated_value_high:
            opp_value = float(opportunity.estimated_value_high)
        elif hasattr(opportunity, 'contract_value') and opportunity.contract_value:
            opp_value = float(opportunity.contract_value)

        if not opp_value:
            return FilterResult(passed=True)  # No value = don't filter

        # Get company's preferred range
        company_range = getattr(company, 'contract_value_range', None)
        if not company_range or company_range not in self.VALUE_RANGES:
            return FilterResult(passed=True)  # No preference = accept all

        min_val, max_val = self.VALUE_RANGES[company_range]

        # Allow flexibility (e.g., 10x on either side)
        flexible_min = min_val / self.value_flexibility
        flexible_max = max_val * self.value_flexibility if max_val != float('inf') else float('inf')

        if opp_value < flexible_min:
            return FilterResult(
                passed=False,
                reason=f"Contract value ${opp_value:,.0f} below company's range (${min_val:,.0f}+)",
                filter_name="contract_value"
            )

        if opp_value > flexible_max:
            return FilterResult(
                passed=False,
                reason=f"Contract value ${opp_value:,.0f} above company's range (${max_val:,.0f})",
                filter_name="contract_value"
            )

        return FilterResult(passed=True)

    def _check_set_aside(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out set-aside opportunities if company lacks certification."""
        set_aside = opportunity.set_aside_type or opportunity.set_aside

        if not set_aside or set_aside.upper() in ['NONE', 'N/A', '']:
            return FilterResult(passed=True)  # No set-aside = open to all

        company_certs = company.certifications or company.set_asides or []

        # Check if this set-aside requires specific certification
        required_certs = self.SETASIDE_CERT_MAP.get(set_aside, [])

        if not required_certs:
            return FilterResult(passed=True)  # Unknown set-aside or open

        # Check if company has any required certification
        if any(cert in company_certs for cert in required_certs):
            return FilterResult(passed=True)

        return FilterResult(
            passed=False,
            reason=f"Missing certification for {set_aside} set-aside (needs: {required_certs})",
            filter_name="set_aside"
        )

    def _check_geography(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> FilterResult:
        """Filter out opportunities outside company's geographic preferences."""
        company_geo = company.geographic_preferences or []

        # Nationwide = accept all
        if not company_geo or "Nationwide" in company_geo:
            return FilterResult(passed=True)

        # Get opportunity location
        opp_state = opportunity.pop_state or opportunity.place_of_performance_state

        if not opp_state:
            return FilterResult(passed=True)  # No location = don't filter

        # Check if opportunity state matches any company preference
        opp_state_upper = opp_state.upper()
        for geo in company_geo:
            if geo.upper() == opp_state_upper:
                return FilterResult(passed=True)
            # Handle full state names
            if self._state_matches(geo, opp_state):
                return FilterResult(passed=True)

        return FilterResult(
            passed=False,
            reason=f"Location '{opp_state}' not in company's geographic preferences",
            filter_name="geography"
        )

    def _state_matches(self, geo_pref: str, opp_state: str) -> bool:
        """Check if a geographic preference matches a state."""
        # State name to abbreviation mapping (partial)
        state_map = {
            'VIRGINIA': 'VA', 'VA': 'VA',
            'MARYLAND': 'MD', 'MD': 'MD',
            'CALIFORNIA': 'CA', 'CA': 'CA',
            'TEXAS': 'TX', 'TX': 'TX',
            'FLORIDA': 'FL', 'FL': 'FL',
            'NEW YORK': 'NY', 'NY': 'NY',
            'DISTRICT OF COLUMBIA': 'DC', 'DC': 'DC',
            # Add more as needed
        }

        geo_upper = geo_pref.upper()
        opp_upper = opp_state.upper()

        geo_abbrev = state_map.get(geo_upper, geo_upper)
        opp_abbrev = state_map.get(opp_upper, opp_upper)

        return geo_abbrev == opp_abbrev


# Singleton instance
opportunity_filter = OpportunityFilter()
