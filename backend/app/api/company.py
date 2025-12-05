from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.company import Company
from ..schemas.company import Company as CompanySchema, CompanyCreate, CompanyUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/company", tags=["company"])


def trigger_evaluations(company_id: str):
    """Background task to run evaluations after company creation"""
    from ..core.database import SessionLocal
    from agents.evaluation import EvaluationAgent

    db = SessionLocal()
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            logger.error(f"Company {company_id} not found for evaluation")
            return

        logger.info(f"Starting evaluations for company: {company.name}")
        agent = EvaluationAgent()
        count = agent.evaluate_new_opportunities(db)
        logger.info(f"Completed {count} evaluations for company: {company.name}")
    except Exception as e:
        logger.error(f"Error running evaluations for company {company_id}: {e}")
    finally:
        db.close()


@router.get("", response_model=CompanySchema)
def get_company(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's company profile"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found. Please complete onboarding."
        )

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    return company


@router.post("", response_model=CompanySchema, status_code=status.HTTP_201_CREATED)
def create_company(
    company_data: CompanyCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create company profile (onboarding)"""
    # Check if user already has a company
    if current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company already exists. Use PUT to update."
        )

    # Create company
    company = Company(**company_data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)

    # Link company to user
    current_user.company_id = company.id
    db.commit()

    # Trigger background evaluation for all opportunities matching this company
    logger.info(f"Triggering background evaluations for company: {company.name}")
    background_tasks.add_task(trigger_evaluations, str(company.id))

    return company


@router.put("", response_model=CompanySchema)
def update_company(
    company_update: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update company profile"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found. Please complete onboarding first."
        )

    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Update company fields
    update_data = company_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    return company
