from sqlalchemy.orm import Session
from typing import Optional
from fastapi import HTTPException, status
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate


def get_company_by_id(db: Session, company_id: str) -> Optional[Company]:
    """Get company by ID."""
    return db.query(Company).filter(Company.id == company_id).first()


def get_user_company(db: Session, user_id: str) -> Optional[Company]:
    """Get company associated with a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.company_id:
        return get_company_by_id(db, user.company_id)
    return None


def create_company(db: Session, company_data: CompanyCreate, user_id: str) -> Company:
    """Create a new company and associate it with the user."""
    # Check if user already has a company
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a company profile"
        )

    # Create company
    db_company = Company(
        name=company_data.name,
        legal_structure=company_data.legal_structure,
        address_street=company_data.address_street,
        address_city=company_data.address_city,
        address_state=company_data.address_state,
        address_zip=company_data.address_zip,
        uei=company_data.uei,
        naics_codes=company_data.naics_codes,
        set_asides=company_data.set_asides,
        capabilities=company_data.capabilities,
        contract_value_min=company_data.contract_value_min,
        contract_value_max=company_data.contract_value_max,
        geographic_preferences=company_data.geographic_preferences,
    )

    db.add(db_company)
    db.commit()
    db.refresh(db_company)

    # Link company to user
    user.company_id = db_company.id
    db.commit()

    return db_company


def update_company(db: Session, company_id: str, company_data: CompanyUpdate, user_id: str) -> Company:
    """Update a company."""
    # Get company
    company = get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Verify user owns this company
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this company"
        )

    # Update fields (only update provided fields)
    update_data = company_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    return company


def delete_company(db: Session, company_id: str, user_id: str) -> None:
    """Delete a company."""
    # Get company
    company = get_company_by_id(db, company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Verify user owns this company
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this company"
        )

    # Unlink from user first
    user.company_id = None
    db.commit()

    # Delete company
    db.delete(company)
    db.commit()
