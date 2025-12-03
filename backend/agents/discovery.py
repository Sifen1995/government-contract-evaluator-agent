"""SAM.gov Discovery Agent - Polls for new opportunities"""
import requests
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.opportunity import Opportunity
from app.models.company import Company
import logging

logger = logging.getLogger(__name__)


class DiscoveryAgent:
    """Agent for discovering government contract opportunities from SAM.gov"""

    def __init__(self):
        self.api_key = settings.SAM_API_KEY
        self.base_url = settings.SAM_API_BASE_URL

    def fetch_opportunities(self, params: dict) -> List[Dict]:
        """Fetch opportunities from SAM.gov API"""
        headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(
                self.base_url,
                headers=headers,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            return data.get("opportunitiesData", [])

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching from SAM.gov: {e}")
            return []

    def poll_new_opportunities(self, db: Session, hours_back: int = 24):
        """Poll for new opportunities posted in the last N hours"""
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(hours=hours_back)

        # Get all companies to match their NAICS codes
        companies = db.query(Company).all()

        if not companies:
            logger.info("No companies found, skipping discovery")
            return

        # Collect all unique NAICS codes
        all_naics = set()
        for company in companies:
            if company.naics_codes:
                all_naics.update(company.naics_codes)

        # Fetch opportunities for each NAICS code
        new_count = 0
        for naics_code in all_naics:
            params = {
                "postedFrom": start_date.strftime("%m/%d/%Y"),
                "postedTo": end_date.strftime("%m/%d/%Y"),
                "ncode": naics_code,
                "limit": 100
            }

            opportunities = self.fetch_opportunities(params)

            for opp_data in opportunities:
                created = self.save_opportunity(db, opp_data)
                if created:
                    new_count += 1

        logger.info(f"Discovery completed: {new_count} new opportunities added")
        return new_count

    def save_opportunity(self, db: Session, opp_data: dict) -> bool:
        """Save or update opportunity in database"""
        source_id = opp_data.get("noticeId", "")

        # Check if already exists
        existing = db.query(Opportunity).filter(
            Opportunity.source == "SAM",
            Opportunity.source_id == source_id
        ).first()

        if existing:
            # Update if needed
            return False

        # Parse dates
        posted_date = self._parse_date(opp_data.get("postedDate"))
        response_deadline = self._parse_date(opp_data.get("responseDeadLine"))

        # Create new opportunity
        opportunity = Opportunity(
            source="SAM",
            source_id=source_id,
            solicitation_number=opp_data.get("solicitationNumber"),
            title=opp_data.get("title", ""),
            description=opp_data.get("description"),
            notice_type=opp_data.get("type"),
            agency=opp_data.get("department"),
            sub_agency=opp_data.get("subTier"),
            office=opp_data.get("office"),
            naics_code=opp_data.get("naicsCode"),
            psc_code=opp_data.get("classificationCode"),
            set_aside_type=opp_data.get("typeOfSetAside"),
            pop_city=opp_data.get("placeOfPerformance", {}).get("city"),
            pop_state=opp_data.get("placeOfPerformance", {}).get("state", {}).get("code"),
            pop_zip=opp_data.get("placeOfPerformance", {}).get("zip"),
            posted_date=posted_date,
            response_deadline=response_deadline,
            contact_name=opp_data.get("pointOfContact", [{}])[0].get("fullName") if opp_data.get("pointOfContact") else None,
            contact_email=opp_data.get("pointOfContact", [{}])[0].get("email") if opp_data.get("pointOfContact") else None,
            contact_phone=opp_data.get("pointOfContact", [{}])[0].get("phone") if opp_data.get("pointOfContact") else None,
            source_url=opp_data.get("uiLink"),
            attachments=opp_data.get("resourceLinks", []),
            status="active",
            raw_data=opp_data
        )

        db.add(opportunity)
        db.commit()

        return True

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string from SAM.gov"""
        if not date_str:
            return None

        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except:
            try:
                return datetime.strptime(date_str, "%m/%d/%Y")
            except:
                return None


def run_discovery():
    """Run discovery agent (called by Celery)"""
    db = SessionLocal()
    try:
        agent = DiscoveryAgent()
        agent.poll_new_opportunities(db)
    finally:
        db.close()
