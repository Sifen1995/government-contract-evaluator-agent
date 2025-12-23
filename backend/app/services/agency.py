"""
Agency and Contact Service

Business logic for agencies, contacts, and company-agency matching.

Reference: TICKET-018, TICKET-019, TICKET-020 from IMPLEMENTATION_TICKETS.md
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import logging

from app.models.agency import Agency, GovernmentContact, CompanyAgencyMatch
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.award import Award

logger = logging.getLogger(__name__)


class AgencyService:
    """Service for managing agencies."""

    def get_agency(self, db: Session, agency_id: UUID) -> Optional[Agency]:
        """Get an agency by ID."""
        return db.query(Agency).filter(Agency.id == agency_id).first()

    def get_agency_by_name(self, db: Session, name: str) -> Optional[Agency]:
        """Get an agency by name or abbreviation."""
        return db.query(Agency).filter(
            (Agency.name == name) | (Agency.abbreviation == name)
        ).first()

    def list_agencies(
        self,
        db: Session,
        level: Optional[str] = None,
        parent_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Agency], int]:
        """List agencies with optional filters."""
        query = db.query(Agency)

        if level:
            query = query.filter(Agency.level == level)
        if parent_id:
            query = query.filter(Agency.parent_agency_id == parent_id)

        total = query.count()
        agencies = query.order_by(Agency.name).offset(skip).limit(limit).all()

        return agencies, total

    def create_agency(self, db: Session, **data) -> Agency:
        """Create a new agency."""
        agency = Agency(**data)
        db.add(agency)
        db.commit()
        db.refresh(agency)
        logger.info(f"Created agency: {agency.name}")
        return agency

    def get_agency_stats(self, db: Session, agency_id: UUID) -> dict:
        """Get statistics for an agency."""
        # Count active opportunities
        opp_count = db.query(func.count(Opportunity.id)).filter(
            Opportunity.issuing_agency.ilike(f"%{agency_id}%")
        ).scalar() or 0

        # Calculate average contract value from awards
        avg_value = db.query(func.avg(Award.amount)).filter(
            Award.awarding_agency.ilike(f"%{agency_id}%")
        ).scalar()

        return {
            "active_opportunities_count": opp_count,
            "avg_contract_value": float(avg_value) if avg_value else None
        }


class ContactService:
    """Service for managing government contacts."""

    def get_contact(self, db: Session, contact_id: UUID) -> Optional[GovernmentContact]:
        """Get a contact by ID."""
        return db.query(GovernmentContact).filter(GovernmentContact.id == contact_id).first()

    def list_contacts(
        self,
        db: Session,
        agency_id: Optional[UUID] = None,
        contact_type: Optional[str] = None,
        is_active: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[GovernmentContact], int]:
        """List contacts with optional filters."""
        query = db.query(GovernmentContact)

        if agency_id:
            query = query.filter(GovernmentContact.agency_id == agency_id)
        if contact_type:
            query = query.filter(GovernmentContact.contact_type == contact_type)
        if is_active is not None:
            query = query.filter(GovernmentContact.is_active == is_active)

        total = query.count()
        contacts = query.order_by(GovernmentContact.last_name).offset(skip).limit(limit).all()

        return contacts, total

    def create_contact(self, db: Session, **data) -> GovernmentContact:
        """Create a new contact."""
        contact = GovernmentContact(**data)
        db.add(contact)
        db.commit()
        db.refresh(contact)
        logger.info(f"Created contact: {contact.full_name}")
        return contact

    def get_agency_contacts_by_type(
        self,
        db: Session,
        agency_id: UUID
    ) -> dict:
        """Get contacts for an agency organized by type."""
        contacts = db.query(GovernmentContact).filter(
            and_(
                GovernmentContact.agency_id == agency_id,
                GovernmentContact.is_active == True
            )
        ).all()

        result = {
            "osdbu": None,
            "contracting_officer": None,
            "industry_liaison": None
        }

        for contact in contacts:
            if contact.contact_type in result:
                result[contact.contact_type] = contact

        return result


class MatchingService:
    """Service for company-agency matching."""

    # Scoring weights
    NAICS_WEIGHT = 0.40
    SET_ASIDE_WEIGHT = 0.30
    GEOGRAPHIC_WEIGHT = 0.15
    AWARD_HISTORY_WEIGHT = 0.15

    def calculate_match_score(
        self,
        db: Session,
        company: Company,
        agency: Agency
    ) -> dict:
        """
        Calculate how well a company matches an agency's contracting patterns.

        Args:
            db: Database session
            company: Company to match
            agency: Agency to match against

        Returns:
            Dict with scores and reasoning
        """
        # Calculate component scores
        naics_score = self._calculate_naics_score(db, company, agency)
        set_aside_score = self._calculate_set_aside_score(company, agency)
        geographic_score = self._calculate_geographic_score(db, company, agency)
        award_history_score = self._calculate_award_history_score(db, company, agency)

        # Weighted combination
        overall_score = int(
            naics_score * self.NAICS_WEIGHT +
            set_aside_score * self.SET_ASIDE_WEIGHT +
            geographic_score * self.GEOGRAPHIC_WEIGHT +
            award_history_score * self.AWARD_HISTORY_WEIGHT
        )

        reasoning = self._generate_reasoning(
            naics_score, set_aside_score, geographic_score, award_history_score
        )

        return {
            "match_score": overall_score,
            "naics_score": naics_score,
            "set_aside_score": set_aside_score,
            "geographic_score": geographic_score,
            "award_history_score": award_history_score,
            "reasoning": reasoning
        }

    def _calculate_naics_score(self, db: Session, company: Company, agency: Agency) -> int:
        """Calculate NAICS alignment score (0-100)."""
        if not company.naics_codes:
            return 0

        # Get agency's top NAICS from awards
        agency_naics = self._get_agency_top_naics(db, agency)
        if not agency_naics:
            return 50  # Neutral if no data

        company_naics = set(company.naics_codes or [])
        overlap = company_naics & agency_naics

        # Score based on overlap count
        if len(overlap) >= 3:
            return 100
        elif len(overlap) == 2:
            return 75
        elif len(overlap) == 1:
            return 50
        else:
            return 25

    def _get_agency_top_naics(self, db: Session, agency: Agency, limit: int = 10) -> set:
        """Get top NAICS codes awarded by agency."""
        # Query awards to get top NAICS
        results = db.query(Award.naics).filter(
            Award.awarding_agency.ilike(f"%{agency.name}%")
        ).group_by(Award.naics).order_by(desc(func.count(Award.id))).limit(limit).all()

        return {r[0] for r in results if r[0]}

    def _calculate_set_aside_score(self, company: Company, agency: Agency) -> int:
        """Calculate set-aside alignment score (0-100)."""
        if not company.set_asides:
            return 0

        score = 0
        company_certs = set(company.set_asides or [])

        # Check each certification against agency goals
        if "8(a)" in company_certs and agency.eight_a_goal_pct:
            if float(agency.eight_a_goal_pct) >= 3:
                score += 35
        if "WOSB" in company_certs and agency.wosb_goal_pct:
            if float(agency.wosb_goal_pct) >= 3:
                score += 25
        if "SDVOSB" in company_certs and agency.sdvosb_goal_pct:
            if float(agency.sdvosb_goal_pct) >= 3:
                score += 25
        if "HUBZone" in company_certs and agency.hubzone_goal_pct:
            if float(agency.hubzone_goal_pct) >= 3:
                score += 20

        return min(100, score)

    def _calculate_geographic_score(self, db: Session, company: Company, agency: Agency) -> int:
        """Calculate geographic fit score (0-100)."""
        if not company.geographic_preferences:
            return 50  # Neutral if no preference

        # Check if company serves nationwide
        if "Nationwide" in company.geographic_preferences:
            return 100

        # Get agency's typical POP locations from awards
        # For simplicity, return a moderate score
        return 70

    def _calculate_award_history_score(self, db: Session, company: Company, agency: Agency) -> int:
        """Calculate award history fit score (0-100)."""
        if not company.contract_value_min and not company.contract_value_max:
            return 50  # Neutral if no preference

        # Get agency's average award value
        avg_award = db.query(func.avg(Award.amount)).filter(
            Award.awarding_agency.ilike(f"%{agency.name}%")
        ).scalar()

        if not avg_award:
            return 50  # Neutral if no data

        avg_award = float(avg_award)
        min_val = float(company.contract_value_min or 0)
        max_val = float(company.contract_value_max or float('inf'))

        # Check if average falls within company's range
        if min_val <= avg_award <= max_val:
            return 100
        elif avg_award < min_val:
            # Agency awards smaller than company prefers
            ratio = avg_award / min_val if min_val > 0 else 0
            return int(max(25, ratio * 100))
        else:
            # Agency awards larger than company prefers
            ratio = max_val / avg_award if avg_award > 0 else 0
            return int(max(25, ratio * 100))

    def _generate_reasoning(
        self,
        naics: int,
        set_aside: int,
        geographic: int,
        award_history: int
    ) -> str:
        """Generate human-readable reasoning for the match score."""
        reasons = []

        if naics >= 75:
            reasons.append("Strong NAICS code alignment with agency's contracting history")
        elif naics >= 50:
            reasons.append("Moderate NAICS code overlap")
        else:
            reasons.append("Limited NAICS code alignment")

        if set_aside >= 75:
            reasons.append("Excellent certification match with agency's small business goals")
        elif set_aside >= 50:
            reasons.append("Good certification alignment")
        elif set_aside > 0:
            reasons.append("Some certification alignment")

        if geographic >= 75:
            reasons.append("Geographic coverage matches agency's typical locations")

        if award_history >= 75:
            reasons.append("Contract value preferences align well with agency's typical awards")
        elif award_history < 50:
            reasons.append("Contract value preferences may not align with agency's typical awards")

        return ". ".join(reasons) + "." if reasons else "Insufficient data for detailed analysis."

    def get_recommended_agencies(
        self,
        db: Session,
        company: Company,
        limit: int = 10,
        use_cache: bool = True
    ) -> List[dict]:
        """
        Get recommended agencies for a company.

        Args:
            db: Database session
            company: Company to get recommendations for
            limit: Maximum number of recommendations
            use_cache: Whether to use cached scores

        Returns:
            List of agency match dictionaries
        """
        if use_cache:
            # Check for cached scores
            cached = db.query(CompanyAgencyMatch).filter(
                CompanyAgencyMatch.company_id == company.id
            ).order_by(desc(CompanyAgencyMatch.match_score)).limit(limit).all()

            if cached:
                return [self._match_to_dict(db, m) for m in cached]

        # Calculate scores for all agencies
        agencies = db.query(Agency).all()
        scores = []

        for agency in agencies:
            score_data = self.calculate_match_score(db, company, agency)
            score_data["agency_id"] = agency.id
            score_data["agency_name"] = agency.name
            score_data["agency_abbreviation"] = agency.abbreviation
            scores.append(score_data)

        # Sort by score and return top N
        scores.sort(key=lambda x: x["match_score"], reverse=True)
        return scores[:limit]

    def _match_to_dict(self, db: Session, match: CompanyAgencyMatch) -> dict:
        """Convert a cached match to a dictionary."""
        agency = match.agency
        stats = agency_service.get_agency_stats(db, agency.id)

        return {
            "agency_id": agency.id,
            "agency_name": agency.name,
            "agency_abbreviation": agency.abbreviation,
            "match_score": match.match_score,
            "naics_score": match.naics_score,
            "set_aside_score": match.set_aside_score,
            "geographic_score": match.geographic_score,
            "award_history_score": match.award_history_score,
            "reasoning": match.reasoning,
            **stats
        }

    def cache_match_scores(
        self,
        db: Session,
        company: Company
    ) -> int:
        """
        Calculate and cache match scores for all agencies.

        Args:
            db: Database session
            company: Company to calculate scores for

        Returns:
            Number of scores cached
        """
        agencies = db.query(Agency).all()
        count = 0

        for agency in agencies:
            score_data = self.calculate_match_score(db, company, agency)

            # Upsert the match record
            existing = db.query(CompanyAgencyMatch).filter(
                and_(
                    CompanyAgencyMatch.company_id == company.id,
                    CompanyAgencyMatch.agency_id == agency.id
                )
            ).first()

            if existing:
                for key, value in score_data.items():
                    setattr(existing, key, value)
                existing.calculated_at = datetime.utcnow()
            else:
                match = CompanyAgencyMatch(
                    company_id=company.id,
                    agency_id=agency.id,
                    **score_data
                )
                db.add(match)

            count += 1

        db.commit()
        logger.info(f"Cached {count} match scores for company {company.id}")
        return count


# Global service instances
agency_service = AgencyService()
contact_service = ContactService()
matching_service = MatchingService()
