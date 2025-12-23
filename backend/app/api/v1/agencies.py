"""
Agency and Contact API Routes

Endpoints for agencies, contacts, and company-agency matching.

Reference: TICKET-018, TICKET-019, TICKET-020 from IMPLEMENTATION_TICKETS.md
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services import company as company_service
from app.services.agency import agency_service, contact_service, matching_service
from app.schemas.agency import (
    AgencyResponse,
    AgencyDetailResponse,
    AgencyListResponse,
    ContactResponse,
    ContactListResponse,
    RecommendedAgenciesResponse,
    AgencyMatchScore,
    OpportunityContactsResponse,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_company(current_user: User, db: Session):
    """Helper to get user's company or raise 404."""
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Please complete onboarding first."
        )
    return company


# ============== Agency Endpoints ==============

@router.get("/", response_model=AgencyListResponse)
def list_agencies(
    level: Optional[str] = Query(None, description="Filter by level (department, agency, sub_agency, office)"),
    parent_id: Optional[UUID] = Query(None, description="Filter by parent agency"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    List all government agencies.

    - Can filter by level or parent agency
    - Returns basic agency info
    """
    agencies, total = agency_service.list_agencies(
        db=db,
        level=level,
        parent_id=parent_id,
        skip=skip,
        limit=limit
    )

    return AgencyListResponse(agencies=agencies, total=total)


@router.get("/recommended", response_model=RecommendedAgenciesResponse)
def get_recommended_agencies(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommended agencies for the current user's company.

    - Returns agencies ranked by match score
    - Includes score breakdown and reasoning
    """
    company = get_user_company(current_user, db)

    recommendations = matching_service.get_recommended_agencies(
        db=db,
        company=company,
        limit=limit
    )

    return RecommendedAgenciesResponse(
        agencies=[AgencyMatchScore(**r) for r in recommendations],
        total=len(recommendations)
    )


@router.get("/{agency_id}", response_model=AgencyDetailResponse)
def get_agency(
    agency_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about an agency.

    - Includes contacts
    - Includes statistics (opportunity count, average contract value)
    """
    agency = agency_service.get_agency(db, agency_id)
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    # Get contacts
    contacts, _ = contact_service.list_contacts(db, agency_id=agency_id)

    # Get stats
    stats = agency_service.get_agency_stats(db, agency_id)

    return AgencyDetailResponse(
        **{k: v for k, v in agency.__dict__.items() if not k.startswith('_')},
        contacts=[_contact_to_response(c) for c in contacts],
        **stats
    )


@router.get("/{agency_id}/contacts", response_model=ContactListResponse)
def get_agency_contacts(
    agency_id: UUID,
    contact_type: Optional[str] = Query(None, description="Filter by type (osdbu, contracting_officer, industry_liaison)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get contacts for an agency.

    - Can filter by contact type
    """
    agency = agency_service.get_agency(db, agency_id)
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    contacts, total = contact_service.list_contacts(
        db=db,
        agency_id=agency_id,
        contact_type=contact_type,
        skip=skip,
        limit=limit
    )

    return ContactListResponse(
        contacts=[_contact_to_response(c) for c in contacts],
        total=total
    )


@router.get("/{agency_id}/match", response_model=AgencyMatchScore)
def get_agency_match_score(
    agency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed match score for a specific agency.

    - Returns score breakdown
    - Returns reasoning
    """
    company = get_user_company(current_user, db)

    agency = agency_service.get_agency(db, agency_id)
    if not agency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agency not found"
        )

    score_data = matching_service.calculate_match_score(db, company, agency)
    stats = agency_service.get_agency_stats(db, agency_id)

    return AgencyMatchScore(
        agency_id=agency.id,
        agency_name=agency.name,
        agency_abbreviation=agency.abbreviation,
        **score_data,
        **stats
    )


# ============== Contact Endpoints ==============

@router.get("/contacts/", response_model=ContactListResponse)
def list_contacts(
    contact_type: Optional[str] = Query(None, description="Filter by type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    List all government contacts.

    - Can filter by contact type
    """
    contacts, total = contact_service.list_contacts(
        db=db,
        contact_type=contact_type,
        skip=skip,
        limit=limit
    )

    return ContactListResponse(
        contacts=[_contact_to_response(c) for c in contacts],
        total=total
    )


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a contact by ID."""
    contact = contact_service.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return _contact_to_response(contact)


def _contact_to_response(contact) -> ContactResponse:
    """Convert contact model to response schema."""
    return ContactResponse(
        id=contact.id,
        first_name=contact.first_name,
        last_name=contact.last_name,
        title=contact.title,
        email=contact.email,
        phone=contact.phone,
        contact_type=contact.contact_type,
        agency_id=contact.agency_id,
        office_name=contact.office_name,
        full_name=contact.full_name,
        is_active=contact.is_active,
        last_verified=contact.last_verified,
        created_at=contact.created_at,
        updated_at=contact.updated_at
    )
