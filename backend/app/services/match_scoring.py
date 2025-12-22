"""
Match scoring service for computing company-opportunity fit scores.
Uses rule-based logic (no AI) for fast, cheap scoring.
"""
from datetime import datetime, timedelta
from itertools import count
from typing import List, Dict, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.opportunity import Opportunity
from app.models.award import Award

from app.models.company import Company
from app.models.company_opportunity_score import CompanyOpportunityScore
import logging

from backend.app.models import opportunity
from backend.app.models import company

logger = logging.getLogger(__name__)


class MatchScoringService:
    """
    Compute match scores between companies and opportunities using rules.

    Score weights:
    - NAICS match: 30%
    - Certification match: 25%
    - Contract size fit: 20%
    - Geographic fit: 15%
    - Deadline score: 10%
    """

    # Score weights (must sum to 1.0)
    WEIGHTS = {
        'naics': 0.30,
        'cert': 0.25,
        'size': 0.20,
        'geo': 0.15,
        'deadline': 0.10
    }

    # Contract value ranges
    VALUE_RANGES = {
        "Micro ($0 - $100K)": (0, 100_000),
        "Small ($100K - $1M)": (100_000, 1_000_000),
        "Medium ($1M - $10M)": (1_000_000, 10_000_000),
        "Large ($10M - $50M)": (10_000_000, 50_000_000),
        "Enterprise ($50M+)": (50_000_000, float('inf'))
    }

    def compute_score(
      self,
      opportunity: Opportunity,
      company: Company,
      db: Session
  ) -> Dict[str, float]:

     naics_score = self._compute_naics_score(opportunity, company)
     cert_score = self._compute_cert_score(opportunity, company)
     size_score = self._compute_size_score(opportunity, company)
     geo_score = self._compute_geo_score(opportunity, company)
     deadline_score = self._compute_deadline_score(opportunity)

    # Base weighted score (0–100)
     base_score = (
        naics_score * self.WEIGHTS['naics'] +
        cert_score * self.WEIGHTS['cert'] +
        size_score * self.WEIGHTS['size'] +
        geo_score * self.WEIGHTS['geo'] +
        deadline_score * self.WEIGHTS['deadline']
    )

    # Bonus signals
     award_score = self._compute_award_history(db, opportunity, company)
     agency_score = self._compute_agency_familiarity(db, opportunity)
     source_score = self._compute_source_weight(opportunity)

     bonus = (
        award_score * 0.10 +
        agency_score * 0.10 +
        source_score * 0.05
    )

     fit_score = min(100.0, base_score + bonus)

     return {
        'fit_score': round(fit_score, 2),
        'naics_score': round(naics_score, 2),
        'cert_score': round(cert_score, 2),
        'size_score': round(size_score, 2),
        'geo_score': round(geo_score, 2),
        'deadline_score': round(deadline_score, 2)
    }


    def _compute_naics_score(self, opportunity: Opportunity, company: Company) -> float:
        """Score NAICS code match (0-100)."""
        company_naics = company.naics_codes or []
        opp_naics = opportunity.naics_code

        if not opp_naics or not company_naics:
            return 50.0  # Neutral if no data

        # Exact match
        if opp_naics in company_naics:
            return 100.0

        # Check for partial match (first 4 digits = same industry group)
        opp_prefix = opp_naics[:4] if len(opp_naics) >= 4 else opp_naics
        for comp_naics in company_naics:
            comp_prefix = comp_naics[:4] if len(comp_naics) >= 4 else comp_naics
            if opp_prefix == comp_prefix:
                return 75.0  # Same industry group

        # Check for 2-digit sector match
        opp_sector = opp_naics[:2] if len(opp_naics) >= 2 else opp_naics
        for comp_naics in company_naics:
            comp_sector = comp_naics[:2] if len(comp_naics) >= 2 else comp_naics
            if opp_sector == comp_sector:
                return 50.0  # Same sector

        return 25.0  # Different sector

    def _compute_cert_score(self, opportunity: Opportunity, company: Company) -> float:
        """Score certification/set-aside match (0-100)."""
        set_aside = opportunity.set_aside_type or getattr(opportunity, 'set_aside', None)

        if not set_aside or set_aside.upper() in ['NONE', 'N/A', '']:
            return 75.0  # No set-aside = neutral (open competition)

        company_certs = company.certifications or getattr(company, 'set_asides', []) or []

        # Map set-aside to required certs
        cert_map = {
            "8(a)": ["8(a)"],
            "8AN": ["8(a)"],
            "WOSB": ["WOSB", "EDWOSB"],
            "EDWOSB": ["EDWOSB"],
            "SDVOSB": ["SDVOSB"],
            "VOSB": ["VOSB", "SDVOSB"],
            "HUBZone": ["HUBZone"],
            "HUBZ": ["HUBZone"],
            "SBA": ["8(a)", "HUBZone", "WOSB", "EDWOSB", "SDVOSB"],
            "Small Business": [],
            "SB": [],
        }

        required_certs = cert_map.get(set_aside, [])

        if not required_certs:
            return 75.0  # Unknown or open set-aside

        # Check if company has required certification
        if any(cert in company_certs for cert in required_certs):
            return 100.0  # Has required cert

        return 25.0  # Missing required cert

    def _compute_size_score(self, opportunity: Opportunity, company: Company) -> float:
        """Score contract size fit (0-100)."""
        # Get opportunity value
        opp_value = None
        if hasattr(opportunity, 'estimated_value_high') and opportunity.estimated_value_high:
            opp_value = float(opportunity.estimated_value_high)
        elif hasattr(opportunity, 'contract_value') and opportunity.contract_value:
            opp_value = float(opportunity.contract_value)

        if not opp_value:
            return 75.0  # No value = neutral

        # Get company's preferred range
        company_range = getattr(company, 'contract_value_range', None)
        if not company_range or company_range not in self.VALUE_RANGES:
            return 75.0  # No preference = neutral

        min_val, max_val = self.VALUE_RANGES[company_range]

        # Within range = 100
        if min_val <= opp_value <= max_val:
            return 100.0

        # Within 2x range = 75
        if min_val / 2 <= opp_value <= (max_val * 2 if max_val != float('inf') else float('inf')):
            return 75.0

        # Within 5x range = 50
        if min_val / 5 <= opp_value <= (max_val * 5 if max_val != float('inf') else float('inf')):
            return 50.0

        return 25.0  # Way outside range

    def _compute_geo_score(self, opportunity: Opportunity, company: Company) -> float:
        """Score geographic fit (0-100)."""
        company_geo = company.geographic_preferences or []

        # Nationwide = perfect match for all
        if not company_geo or "Nationwide" in company_geo:
            return 100.0

        # Get opportunity location
        opp_state = opportunity.pop_state or getattr(opportunity, 'place_of_performance_state', None)

        if not opp_state:
            return 75.0  # No location = neutral

        # Check if state matches
        opp_state_upper = opp_state.upper()
        for geo in company_geo:
            if geo.upper() == opp_state_upper:
                return 100.0

        # Check neighboring states (simplified)
        neighboring = {
            'VA': ['MD', 'DC', 'NC', 'WV', 'KY', 'TN'],
            'MD': ['VA', 'DC', 'PA', 'DE', 'WV'],
            'DC': ['VA', 'MD'],
            'CA': ['OR', 'NV', 'AZ'],
            'TX': ['NM', 'OK', 'AR', 'LA'],
            # Add more as needed
        }

        for geo in company_geo:
            geo_upper = geo.upper()
            if geo_upper in neighboring:
                if opp_state_upper in neighboring[geo_upper]:
                    return 75.0  # Neighboring state

        return 50.0  # Different region

    def _compute_deadline_score(self, opportunity: Opportunity) -> float:
        """Score time to deadline (0-100)."""
        if not opportunity.response_deadline:
            return 50.0  # No deadline = neutral

        deadline = opportunity.response_deadline
        if deadline.tzinfo:
            deadline = deadline.replace(tzinfo=None)

        days_until = (deadline - datetime.utcnow()).days

        if days_until < 0:
            return 0.0  # Expired

        if days_until < 7:
            return 25.0  # Very soon

        if days_until < 14:
            return 50.0  # Soon

        if days_until < 30:
            return 75.0  # Good amount of time

        if days_until < 60:
            return 100.0  # Plenty of time

        return 90.0  # Far out (slightly lower as it may change)

    def compute_and_cache(
        self,
        db: Session,
        opportunity: Opportunity,
        company: Company
    ) -> CompanyOpportunityScore:
        """
        Compute score and cache it in the database.

        Args:
            db: Database session
            opportunity: Opportunity to score
            company: Company to match against

        Returns:
            CompanyOpportunityScore instance
        """
        scores = self.compute_score(opportunity, company)

        # Check for existing score
        existing = db.query(CompanyOpportunityScore).filter(
            CompanyOpportunityScore.company_id == company.id,
            CompanyOpportunityScore.opportunity_id == opportunity.id
        ).first()

        if existing:
            # Update existing score
            existing.fit_score = Decimal(str(scores['fit_score']))
            existing.naics_score = Decimal(str(scores['naics_score']))
            existing.cert_score = Decimal(str(scores['cert_score']))
            existing.size_score = Decimal(str(scores['size_score']))
            existing.geo_score = Decimal(str(scores['geo_score']))
            existing.deadline_score = Decimal(str(scores['deadline_score']))
            existing.computed_at = datetime.utcnow()
            db.commit()
            return existing

        # Create new score
        score = CompanyOpportunityScore(
            company_id=company.id,
            opportunity_id=opportunity.id,
            fit_score=Decimal(str(scores['fit_score'])),
            naics_score=Decimal(str(scores['naics_score'])),
            cert_score=Decimal(str(scores['cert_score'])),
            size_score=Decimal(str(scores['size_score'])),
            geo_score=Decimal(str(scores['geo_score'])),
            deadline_score=Decimal(str(scores['deadline_score']))
        )
        db.add(score)
        db.commit()
        return score

    def compute_batch(
        self,
        db: Session,
        opportunities: List[Opportunity],
        company: Company
    ) -> int:
        """
        Compute and cache scores for a batch of opportunities.

        Args:
            db: Database session
            opportunities: List of opportunities to score
            company: Company to match against

        Returns:
            Number of scores computed
        """
        count = 0
        for opp in opportunities:
            try:
                self.compute_and_cache(db, opp, company)
                count += 1
            except Exception as e:
                logger.error(f"Error computing score for opp {opp.id}: {e}")
                continue

        logger.info(f"Computed {count} match scores for company {company.id}")
        return count

    def get_cached_score(
        self,
        db: Session,
        opportunity_id: str,
        company_id: str
    ) -> Optional[CompanyOpportunityScore]:
        """Get cached score if it exists."""
        return db.query(CompanyOpportunityScore).filter(
            CompanyOpportunityScore.company_id == company_id,
            CompanyOpportunityScore.opportunity_id == opportunity_id
        ).first()

    def _compute_award_history(
        self,
        db: Session,
        opportunity: Opportunity,
        company: Company
   ) -> float:
       if not opportunity.naics_code:
          return 50.0

       count = db.query(Award).filter(
       Award.naics == opportunity.naics_code
      ).count()

       return min(100.0, count * 10.0)


    def _compute_agency_familiarity(
      self,
      db: Session,
      opportunity: Opportunity
  ) -> float:
     if not opportunity.issuing_agency:
        return 50.0

     count = db.query(Award).filter(
     Award.agency.ilike(f"%{opportunity.issuing_agency}%")
    ).count()

     return min(100.0, count * 10.0)


    def _compute_source_weight(self, opportunity: Opportunity) -> float:
      weights = {
        "sam.gov": 100.0,
        "dc_ocp": 80.0,
        "dc_independent": 75.0,
        "procurement_forecast": 30.0
    }
      return weights.get(opportunity.source, 50.0)




# Singleton instance
match_scoring_service = MatchScoringService()
