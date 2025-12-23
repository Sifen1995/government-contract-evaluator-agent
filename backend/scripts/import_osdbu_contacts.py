#!/usr/bin/env python3
"""
Standalone script for importing OSDBU (Office of Small & Disadvantaged Business Utilization)
contacts from SBA directory and other sources.

This script populates the agencies and government_contacts tables with federal agency
contacts responsible for small business programs.

Usage:
    python scripts/import_osdbu_contacts.py

Run monthly to keep contact data fresh.
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime
from uuid import uuid4
from typing import List, Dict, Optional

from app.core.database import SessionLocal
from app.models.agency import Agency, GovernmentContact

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Major federal agencies with their typical OSDBU contacts
# This is seed data - in production, this would be scraped/updated from SBA directory
FEDERAL_AGENCIES = [
    {
        "name": "Department of Defense",
        "abbreviation": "DoD",
        "level": "department",
        "small_business_url": "https://business.defense.gov/",
        "forecast_url": "https://www.acq.osd.mil/osbp/forecast/index.shtml",
        "small_business_goal_pct": 23.0,
        "eight_a_goal_pct": 5.0,
        "wosb_goal_pct": 5.0,
        "sdvosb_goal_pct": 3.0,
        "hubzone_goal_pct": 3.0,
    },
    {
        "name": "Department of Veterans Affairs",
        "abbreviation": "VA",
        "level": "department",
        "small_business_url": "https://www.va.gov/osdbu/",
        "small_business_goal_pct": 23.0,
        "sdvosb_goal_pct": 15.0,  # VA has higher SDVOSB goal
    },
    {
        "name": "Department of Health and Human Services",
        "abbreviation": "HHS",
        "level": "department",
        "small_business_url": "https://www.hhs.gov/about/agencies/asfr/ogapa/osdbu/",
        "small_business_goal_pct": 23.0,
        "wosb_goal_pct": 5.0,
    },
    {
        "name": "Department of Homeland Security",
        "abbreviation": "DHS",
        "level": "department",
        "small_business_url": "https://www.dhs.gov/small-business",
        "forecast_url": "https://www.dhs.gov/procurement-forecast",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "General Services Administration",
        "abbreviation": "GSA",
        "level": "agency",
        "small_business_url": "https://www.gsa.gov/small-business",
        "vendor_portal_url": "https://sam.gov",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Energy",
        "abbreviation": "DOE",
        "level": "department",
        "small_business_url": "https://www.energy.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Transportation",
        "abbreviation": "DOT",
        "level": "department",
        "small_business_url": "https://www.transportation.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of the Treasury",
        "abbreviation": "Treasury",
        "level": "department",
        "small_business_url": "https://home.treasury.gov/about/offices/management/procurement-services/office-of-small-and-disadvantaged-business-utilization",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Commerce",
        "abbreviation": "DOC",
        "level": "department",
        "small_business_url": "https://www.commerce.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Justice",
        "abbreviation": "DOJ",
        "level": "department",
        "small_business_url": "https://www.justice.gov/jmd/office-small-and-disadvantaged-business-utilization",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Labor",
        "abbreviation": "DOL",
        "level": "department",
        "small_business_url": "https://www.dol.gov/agencies/oasam/centers-offices/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of State",
        "abbreviation": "State",
        "level": "department",
        "small_business_url": "https://www.state.gov/small-business/",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of the Interior",
        "abbreviation": "DOI",
        "level": "department",
        "small_business_url": "https://www.doi.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Agriculture",
        "abbreviation": "USDA",
        "level": "department",
        "small_business_url": "https://www.usda.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Education",
        "abbreviation": "ED",
        "level": "department",
        "small_business_url": "https://www2.ed.gov/about/offices/list/osdbu/",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Department of Housing and Urban Development",
        "abbreviation": "HUD",
        "level": "department",
        "small_business_url": "https://www.hud.gov/program_offices/sdb",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Environmental Protection Agency",
        "abbreviation": "EPA",
        "level": "agency",
        "small_business_url": "https://www.epa.gov/osdbu",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "National Aeronautics and Space Administration",
        "abbreviation": "NASA",
        "level": "agency",
        "small_business_url": "https://www.nasa.gov/osbp/",
        "forecast_url": "https://www.nasa.gov/osbp/procurement-forecast/",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Social Security Administration",
        "abbreviation": "SSA",
        "level": "agency",
        "small_business_url": "https://www.ssa.gov/oag/osdbu/",
        "small_business_goal_pct": 23.0,
    },
    {
        "name": "Small Business Administration",
        "abbreviation": "SBA",
        "level": "agency",
        "small_business_url": "https://www.sba.gov/",
        "small_business_goal_pct": 100.0,  # SBA focuses on small business
    },
]


# Sample OSDBU contact data - in production this would be scraped/updated
SAMPLE_CONTACTS = [
    {
        "agency_abbr": "DoD",
        "first_name": "Small Business",
        "last_name": "Office",
        "title": "Director, Office of Small Business Programs",
        "email": "osbp@osd.mil",
        "contact_type": "osdbu",
        "source": "manual",
    },
    {
        "agency_abbr": "VA",
        "first_name": "OSDBU",
        "last_name": "Office",
        "title": "Executive Director, OSDBU",
        "email": "osdbu@va.gov",
        "contact_type": "osdbu",
        "source": "manual",
    },
    {
        "agency_abbr": "GSA",
        "first_name": "OSDBU",
        "last_name": "Office",
        "title": "Associate Administrator, OSDBU",
        "email": "small.business@gsa.gov",
        "contact_type": "osdbu",
        "source": "manual",
    },
    {
        "agency_abbr": "NASA",
        "first_name": "OSBP",
        "last_name": "Office",
        "title": "Associate Administrator, Small Business Programs",
        "email": "osbp@hq.nasa.gov",
        "contact_type": "osdbu",
        "source": "manual",
    },
    {
        "agency_abbr": "HHS",
        "first_name": "OSDBU",
        "last_name": "Office",
        "title": "Director, OSDBU",
        "email": "osdbu@hhs.gov",
        "contact_type": "osdbu",
        "source": "manual",
    },
]


def get_or_create_agency(db, agency_data: Dict) -> Agency:
    """Get existing agency or create new one."""
    existing = db.query(Agency).filter(
        Agency.abbreviation == agency_data.get("abbreviation")
    ).first()

    if existing:
        # Update existing agency with new data
        for key, value in agency_data.items():
            if value is not None:
                setattr(existing, key, value)
        return existing

    # Create new agency
    agency = Agency(
        id=str(uuid4()),
        **agency_data
    )
    db.add(agency)
    return agency


def get_or_create_contact(db, contact_data: Dict, agency: Agency) -> Optional[GovernmentContact]:
    """Get existing contact or create new one."""
    # Check for existing contact by email
    if contact_data.get("email"):
        existing = db.query(GovernmentContact).filter(
            GovernmentContact.email == contact_data.get("email")
        ).first()

        if existing:
            # Update existing contact
            existing.last_verified = datetime.utcnow()
            return existing

    # Create new contact
    contact = GovernmentContact(
        id=str(uuid4()),
        agency_id=agency.id,
        first_name=contact_data.get("first_name"),
        last_name=contact_data.get("last_name"),
        title=contact_data.get("title"),
        email=contact_data.get("email"),
        phone=contact_data.get("phone"),
        contact_type=contact_data.get("contact_type", "osdbu"),
        source=contact_data.get("source", "manual"),
        last_verified=datetime.utcnow(),
        is_active=True,
    )
    db.add(contact)
    return contact


def import_agencies_and_contacts():
    """Import all agencies and contacts."""
    db = SessionLocal()
    try:
        logger.info("Starting OSDBU import task...")

        agencies_created = 0
        agencies_updated = 0
        contacts_created = 0
        contacts_updated = 0

        # Create/update agencies
        agency_map = {}
        for agency_data in FEDERAL_AGENCIES:
            agency = get_or_create_agency(db, agency_data)
            agency_map[agency_data.get("abbreviation")] = agency

            if agency.created_at == agency.updated_at:
                agencies_created += 1
            else:
                agencies_updated += 1

        db.commit()
        logger.info(f"Agencies: {agencies_created} created, {agencies_updated} updated")

        # Create/update contacts
        for contact_data in SAMPLE_CONTACTS:
            agency_abbr = contact_data.pop("agency_abbr")
            agency = agency_map.get(agency_abbr)

            if not agency:
                logger.warning(f"Agency not found for abbreviation: {agency_abbr}")
                continue

            contact = get_or_create_contact(db, contact_data, agency)
            if contact:
                if contact.created_at == contact.updated_at:
                    contacts_created += 1
                else:
                    contacts_updated += 1

        db.commit()
        logger.info(f"Contacts: {contacts_created} created, {contacts_updated} updated")

        result = {
            "agencies_created": agencies_created,
            "agencies_updated": agencies_updated,
            "contacts_created": contacts_created,
            "contacts_updated": contacts_updated,
        }

        logger.info(f"OSDBU import completed: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in OSDBU import: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def fetch_osdbu_directory():
    """
    Fetch OSDBU directory from SBA website.
    This is a placeholder for future web scraping implementation.

    The SBA maintains a directory at:
    https://www.sba.gov/federal-contracting/counseling-help/osdbu-directory
    """
    logger.info("Web scraping of OSDBU directory not yet implemented")
    logger.info("Using static seed data instead")
    # TODO: Implement web scraping of SBA OSDBU directory
    # The directory contains contact information for all federal OSDBU offices
    return None


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== OSDBU import job started at {start_time} ===")

    try:
        # Try to fetch live data (not implemented yet)
        fetch_osdbu_directory()

        # Import from seed data
        result = import_agencies_and_contacts()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== OSDBU import job completed in {duration:.2f} seconds ===")
