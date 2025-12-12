"""
Discovery Agent - SAM.gov Polling Agent

This agent is responsible for:
- Polling SAM.gov API for new government contract opportunities
- Matching opportunities to company NAICS codes
- Creating new opportunity records in the database
- Triggering AI evaluation for matched opportunities
"""

from typing import List, Dict, Optional
from datetime import datetime
import asyncio
import logging

from app.core.database import SessionLocal
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.services.sam_gov import sam_gov_service
from app.services.opportunity import opportunity_service

logger = logging.getLogger(__name__)


class DiscoveryAgent:
    """
    Agent for automated discovery of government contract opportunities.

    This agent runs on a schedule (every 15 minutes via Celery Beat) to:
    1. Collect NAICS codes from all registered companies
    2. Search SAM.gov for matching opportunities
    3. Parse and store new opportunities
    4. Track discovery statistics
    """

    def __init__(self, db_session=None):
        """
        Initialize the Discovery Agent.

        Args:
            db_session: Optional SQLAlchemy session. If not provided,
                       a new session will be created.
        """
        self.db = db_session
        self._owns_session = db_session is None

    def __enter__(self):
        if self._owns_session:
            self.db = SessionLocal()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._owns_session and self.db:
            self.db.close()

    def get_all_company_naics_codes(self) -> List[str]:
        """
        Collect all unique NAICS codes from registered companies.

        Returns:
            List of unique NAICS code strings
        """
        companies = self.db.query(Company).filter(
            Company.naics_codes.isnot(None)
        ).all()

        all_naics = set()
        for company in companies:
            if company.naics_codes:
                all_naics.update(company.naics_codes)

        logger.info(f"Collected {len(all_naics)} unique NAICS codes from {len(companies)} companies")
        return list(all_naics)

    def get_companies_for_naics(self, naics_code: str) -> List[Company]:
        """
        Get all companies that have a specific NAICS code.

        Args:
            naics_code: The NAICS code to match

        Returns:
            List of Company objects
        """
        companies = self.db.query(Company).filter(
            Company.naics_codes.isnot(None)
        ).all()

        matching = [c for c in companies if naics_code in (c.naics_codes or [])]
        return matching

    async def search_opportunities(
        self,
        naics_codes: List[str],
        limit: int = 100
    ) -> List[Dict]:
        """
        Search SAM.gov for opportunities matching NAICS codes.

        Args:
            naics_codes: List of NAICS codes to search for
            limit: Maximum number of opportunities to return

        Returns:
            List of raw opportunity data from SAM.gov
        """
        try:
            result = await sam_gov_service.search_opportunities(
                naics_codes=naics_codes,
                active=True,
                limit=limit
            )

            opportunities = result.get("opportunities", [])
            logger.info(f"Found {len(opportunities)} opportunities from SAM.gov")
            return opportunities

        except Exception as e:
            logger.error(f"Error searching SAM.gov: {str(e)}")
            return []

    def process_opportunity(self, raw_opportunity: Dict) -> Optional[Opportunity]:
        """
        Process and store a single opportunity.

        Args:
            raw_opportunity: Raw opportunity data from SAM.gov

        Returns:
            Created or updated Opportunity object, or None on error
        """
        try:
            # Parse opportunity data
            opp_data = sam_gov_service.parse_opportunity(raw_opportunity)

            # Create or update opportunity
            opportunity = opportunity_service.create_opportunity(self.db, opp_data)

            return opportunity

        except Exception as e:
            logger.error(f"Error processing opportunity: {str(e)}")
            return None

    def run_discovery(self) -> Dict:
        """
        Execute the full discovery workflow.

        This method:
        1. Collects NAICS codes from all companies
        2. Searches SAM.gov for opportunities
        3. Processes and stores new opportunities

        Returns:
            Dict with discovery statistics:
            - companies: Number of companies with NAICS codes
            - naics_codes: Number of unique NAICS codes searched
            - discovered: Number of new opportunities discovered
        """
        logger.info("Starting opportunity discovery...")

        # Get all NAICS codes
        naics_codes = self.get_all_company_naics_codes()

        if not naics_codes:
            logger.info("No NAICS codes found - skipping discovery")
            return {
                "companies": 0,
                "naics_codes": 0,
                "discovered": 0
            }

        # Count companies
        company_count = self.db.query(Company).filter(
            Company.naics_codes.isnot(None)
        ).count()

        # Search for opportunities
        raw_opportunities = asyncio.run(
            self.search_opportunities(naics_codes)
        )

        # Process opportunities
        discovered = 0
        for raw_opp in raw_opportunities:
            opportunity = self.process_opportunity(raw_opp)
            if opportunity:
                discovered += 1

        logger.info(f"Discovery complete: {discovered} opportunities discovered")

        return {
            "companies": company_count,
            "naics_codes": len(naics_codes),
            "discovered": discovered
        }


def run_discovery_agent() -> Dict:
    """
    Convenience function to run the discovery agent.

    This function is called by the Celery task.

    Returns:
        Dict with discovery statistics
    """
    with DiscoveryAgent() as agent:
        return agent.run_discovery()
