from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_, or_
from fastapi import HTTPException, status
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import math
from ..models.opportunity import Opportunity
from ..models.evaluation import Evaluation
from ..models.saved_opportunity import SavedOpportunity, DismissedOpportunity
from ..models.user import User
from ..schemas.opportunity import OpportunityFilter


def get_opportunities_for_user(
    db: Session,
    user: User,
    filters: OpportunityFilter
) -> Tuple[List[dict], int]:
    """Get paginated opportunities with evaluations for a user"""

    # Base query - get opportunities that match user's company profile
    query = db.query(Opportunity).filter(Opportunity.status == "active")

    # Filter by user's company NAICS codes if they have a company
    if user.company and user.company.naics_codes:
        query = query.filter(Opportunity.naics_code.in_(user.company.naics_codes))

    # Filter by user's company set-asides
    if user.company and user.company.set_asides:
        query = query.filter(Opportunity.set_aside_type.in_(user.company.set_asides))

    # Exclude dismissed opportunities
    dismissed_ids = db.query(DismissedOpportunity.opportunity_id).filter(
        DismissedOpportunity.user_id == user.id
    ).all()
    dismissed_ids = [d[0] for d in dismissed_ids]
    if dismissed_ids:
        query = query.filter(~Opportunity.id.in_(dismissed_ids))

    # Apply filters
    if filters.set_aside:
        query = query.filter(Opportunity.set_aside_type == filters.set_aside)

    if filters.agency:
        query = query.filter(Opportunity.agency.ilike(f"%{filters.agency}%"))

    if filters.naics_code:
        query = query.filter(Opportunity.naics_code == filters.naics_code)

    # Get total count
    total = query.count()

    # Join with evaluations if filtering by score
    if filters.min_score:
        query = query.join(Evaluation).filter(
            and_(
                Evaluation.company_id == user.company_id,
                Evaluation.fit_score >= filters.min_score
            )
        )

    # Sorting
    if filters.sort_by == "fit_score":
        # Join with evaluations for sorting
        query = query.outerjoin(Evaluation, and_(
            Evaluation.opportunity_id == Opportunity.id,
            Evaluation.company_id == user.company_id
        ))
        if filters.sort_order == "desc":
            query = query.order_by(desc(Evaluation.fit_score))
        else:
            query = query.order_by(asc(Evaluation.fit_score))
    elif filters.sort_by == "deadline":
        if filters.sort_order == "desc":
            query = query.order_by(desc(Opportunity.response_deadline))
        else:
            query = query.order_by(asc(Opportunity.response_deadline))
    elif filters.sort_by == "posted_date":
        if filters.sort_order == "desc":
            query = query.order_by(desc(Opportunity.posted_date))
        else:
            query = query.order_by(asc(Opportunity.posted_date))

    # Pagination
    offset = (filters.page - 1) * filters.page_size
    opportunities = query.offset(offset).limit(filters.page_size).all()

    # Attach evaluations
    results = []
    for opp in opportunities:
        evaluation = db.query(Evaluation).filter(
            and_(
                Evaluation.opportunity_id == opp.id,
                Evaluation.company_id == user.company_id
            )
        ).first()

        results.append({
            **opp.__dict__,
            "evaluation": evaluation
        })

    return results, total


def save_opportunity(db: Session, user_id: str, opportunity_id: str, status: str = "watching") -> SavedOpportunity:
    """Save an opportunity to user's pipeline"""
    # Check if already saved
    existing = db.query(SavedOpportunity).filter(
        and_(
            SavedOpportunity.user_id == user_id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Opportunity already saved"
        )

    saved = SavedOpportunity(
        user_id=user_id,
        opportunity_id=opportunity_id,
        status=status
    )

    db.add(saved)
    db.commit()
    db.refresh(saved)

    return saved


def dismiss_opportunity(db: Session, user_id: str, opportunity_id: str) -> DismissedOpportunity:
    """Dismiss an opportunity"""
    # Check if already dismissed
    existing = db.query(DismissedOpportunity).filter(
        and_(
            DismissedOpportunity.user_id == user_id,
            DismissedOpportunity.opportunity_id == opportunity_id
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Opportunity already dismissed"
        )

    dismissed = DismissedOpportunity(
        user_id=user_id,
        opportunity_id=opportunity_id
    )

    db.add(dismissed)
    db.commit()
    db.refresh(dismissed)

    return dismissed


def get_pipeline_opportunities(db: Session, user_id: str, status: Optional[str] = None) -> List[dict]:
    """Get user's saved opportunities"""
    query = db.query(SavedOpportunity).filter(SavedOpportunity.user_id == user_id)

    if status:
        query = query.filter(SavedOpportunity.status == status)

    saved_opps = query.all()

    results = []
    for saved in saved_opps:
        opportunity = db.query(Opportunity).filter(Opportunity.id == saved.opportunity_id).first()
        if opportunity:
            evaluation = db.query(Evaluation).filter(
                Evaluation.opportunity_id == opportunity.id
            ).first()

            results.append({
                "saved": saved,
                "opportunity": opportunity,
                "evaluation": evaluation
            })

    return results


def get_pipeline_stats(db: Session, user_id: str) -> dict:
    """Get pipeline statistics"""
    saved_opps = db.query(SavedOpportunity).filter(SavedOpportunity.user_id == user_id).all()

    stats = {
        "watching": 0,
        "pursuing": 0,
        "submitted": 0,
        "won": 0,
        "lost": 0,
        "total": len(saved_opps)
    }

    for opp in saved_opps:
        if opp.status in stats:
            stats[opp.status] += 1

    return stats


def get_upcoming_deadlines(db: Session, user_id: str, days: int = 14) -> List[dict]:
    """Get upcoming deadlines for saved opportunities"""
    deadline_date = datetime.utcnow() + timedelta(days=days)

    saved_opps = db.query(SavedOpportunity).filter(SavedOpportunity.user_id == user_id).all()
    opp_ids = [s.opportunity_id for s in saved_opps]

    opportunities = db.query(Opportunity).filter(
        and_(
            Opportunity.id.in_(opp_ids),
            Opportunity.response_deadline.isnot(None),
            Opportunity.response_deadline <= deadline_date,
            Opportunity.response_deadline >= datetime.utcnow()
        )
    ).order_by(asc(Opportunity.response_deadline)).all()

    results = []
    for opp in opportunities:
        days_remaining = (opp.response_deadline - datetime.utcnow()).days
        saved = next((s for s in saved_opps if s.opportunity_id == opp.id), None)

        results.append({
            "opportunity_id": opp.id,
            "title": opp.title,
            "response_deadline": opp.response_deadline,
            "days_remaining": days_remaining,
            "status": saved.status if saved else "unknown"
        })

    return results
