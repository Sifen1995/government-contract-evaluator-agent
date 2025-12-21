from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.schemas.auth import MessageResponse
from app.services import company as company_service
from app.api.deps import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=CompanyResponse)
def get_my_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's company profile.

    - Returns company profile if exists
    - Returns 404 if no company profile
    """
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Please complete onboarding."
        )
    return company


@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a company profile for current user.

    - User can only have one company profile
    - Returns 400 if company already exists
    - Automatically triggers opportunity discovery after creation
    """
    company = company_service.create_company(db, company_data, current_user.id)

    # Note: Initial opportunity discovery will happen on next cron job run (every 15 min)
    logger.info(f"Company created: {company.id}. Discovery will run on next scheduled job.")

    return company


@router.put("/", response_model=CompanyResponse)
def update_my_company(
    company_data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's company profile.

    - Only updates provided fields
    - Returns 404 if no company profile exists
    """
    # Get user's company
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Please create one first."
        )

    # Update company
    updated_company = company_service.update_company(db, company.id, company_data, current_user.id)
    return updated_company


@router.delete("/", response_model=MessageResponse)
def delete_my_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete current user's company profile.

    - Permanently deletes company profile
    - User can create a new one afterward
    """
    # Get user's company
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found"
        )

    # Delete company
    company_service.delete_company(db, company.id, current_user.id)
    return MessageResponse(message="Company profile deleted successfully")


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: str,
    db: Session = Depends(get_db)
):
    """
    Get company by ID (public endpoint for future features).

    - Returns company profile
    - Returns 404 if not found
    """
    company = company_service.get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    return company
