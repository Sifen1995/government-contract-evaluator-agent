"""
Opportunity and Evaluation CRUD service
"""
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
from app.models.company import Company
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class OpportunityService:
    """Service for managing opportunities and evaluations"""

    def create_opportunity(self, db: Session, opportunity_data: Dict) -> Opportunity:
        """
        Create a new opportunity

        Args:
            db: Database session
            opportunity_data: Dict with opportunity fields

        Returns:
            Created Opportunity instance
        """
        # Check if opportunity already exists
        existing = db.query(Opportunity).filter(
            Opportunity.source_id == opportunity_data.get("source_id")
        ).first()

        if existing:
            logger.info(f"Opportunity {opportunity_data.get('notice_id')} already exists, updating...")
            return self.update_opportunity(db, existing.id, opportunity_data)

        opportunity = Opportunity(**opportunity_data)
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)

        logger.info(f"Created opportunity {opportunity.notice_id}")
        return opportunity

    def update_opportunity(self, db: Session, opportunity_id: str, opportunity_data: Dict) -> Opportunity:
        """
        Update an existing opportunity

        Args:
            db: Database session
            opportunity_id: ID of opportunity to update
            opportunity_data: Dict with fields to update

        Returns:
            Updated Opportunity instance
        """
        opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise ValueError(f"Opportunity {opportunity_id} not found")

        # Update fields
        for key, value in opportunity_data.items():
            if hasattr(opportunity, key):
                setattr(opportunity, key, value)

        opportunity.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(opportunity)

        logger.info(f"Updated opportunity {opportunity.notice_id}")
        return opportunity

    def get_opportunity_by_id(self, db: Session, opportunity_id: str) -> Optional[Opportunity]:
        """Get opportunity by ID"""
        return db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()

    def get_opportunity_by_notice_id(self, db: Session, notice_id: str) -> Optional[Opportunity]:
        """Get opportunity by SAM.gov notice ID (source_id)"""
        return db.query(Opportunity).filter(Opportunity.source_id == notice_id).first()

    def list_opportunities(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = True,
        naics_codes: Optional[List[str]] = None,
        deadline_after: Optional[datetime] = None
    ) -> List[Opportunity]:
        """
        List opportunities with optional filters

        Args:
            db: Database session
            skip: Number of records to skip (pagination)
            limit: Max number of records to return
            active_only: Only return active opportunities
            naics_codes: Filter by NAICS codes
            deadline_after: Only opportunities with deadline after this date

        Returns:
            List of Opportunity instances
        """
        query = db.query(Opportunity)

        # Apply filters
        if active_only:
            query = query.filter(Opportunity.status == "active")

        if naics_codes:
            query = query.filter(Opportunity.naics_code.in_(naics_codes))

        if deadline_after:
            query = query.filter(Opportunity.response_deadline >= deadline_after)

        # Order by most recent first
        query = query.order_by(desc(Opportunity.posted_date))

        return query.offset(skip).limit(limit).all()

    def create_evaluation(self, db: Session, evaluation_data: Dict) -> Evaluation:
        """
        Create a new evaluation

        Args:
            db: Database session
            evaluation_data: Dict with evaluation fields

        Returns:
            Created Evaluation instance
        """
        # Check if evaluation already exists for this opportunity + company
        existing = db.query(Evaluation).filter(
            and_(
                Evaluation.opportunity_id == evaluation_data.get("opportunity_id"),
                Evaluation.company_id == evaluation_data.get("company_id")
            )
        ).first()

        if existing:
            logger.info(
                f"Evaluation for opportunity {evaluation_data.get('opportunity_id')} "
                f"and company {evaluation_data.get('company_id')} already exists, updating..."
            )
            return self.update_evaluation(db, existing.id, evaluation_data)

        # Filter evaluation_data to only include valid Evaluation model fields
        valid_fields = {
            'opportunity_id', 'company_id', 'fit_score', 'win_probability',
            'recommendation', 'confidence', 'reasoning', 'strengths',
            'weaknesses', 'executive_summary', 'evaluated_at'
        }
        filtered_data = {k: v for k, v in evaluation_data.items() if k in valid_fields}

        evaluation = Evaluation(**filtered_data)
        db.add(evaluation)
        db.commit()
        db.refresh(evaluation)

        logger.info(
            f"Created evaluation for opportunity {evaluation.opportunity_id}, "
            f"company {evaluation.company_id}: {evaluation.recommendation}"
        )
        return evaluation

    def update_evaluation(self, db: Session, evaluation_id: str, evaluation_data: Dict) -> Evaluation:
        """
        Update an existing evaluation

        Args:
            db: Database session
            evaluation_id: ID of evaluation to update
            evaluation_data: Dict with fields to update

        Returns:
            Updated Evaluation instance
        """
        evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not evaluation:
            raise ValueError(f"Evaluation {evaluation_id} not found")

        # Filter to valid fields and update
        valid_fields = {
            'fit_score', 'win_probability', 'recommendation', 'confidence',
            'reasoning', 'strengths', 'weaknesses', 'executive_summary'
        }
        for key, value in evaluation_data.items():
            if key in valid_fields and hasattr(evaluation, key):
                setattr(evaluation, key, value)

        evaluation.evaluated_at = datetime.utcnow()
        db.commit()
        db.refresh(evaluation)

        logger.info(f"Updated evaluation {evaluation.id}")
        return evaluation

    def get_evaluation_by_id(self, db: Session, evaluation_id: str) -> Optional[Evaluation]:
        """Get evaluation by ID"""
        return db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()

    def get_evaluation_for_opportunity(
        self,
        db: Session,
        opportunity_id: str,
        company_id: str
    ) -> Optional[Evaluation]:
        """Get evaluation for a specific opportunity and company"""
        return db.query(Evaluation).filter(
            and_(
                Evaluation.opportunity_id == opportunity_id,
                Evaluation.company_id == company_id
            )
        ).first()

    def list_evaluations_for_company(
        self,
        db: Session,
        company_id: str,
        skip: int = 0,
        limit: int = 100,
        recommendation: Optional[str] = None,
        min_fit_score: Optional[float] = None
    ) -> List[Evaluation]:
        """
        List evaluations for a company

        Args:
            db: Database session
            company_id: Company ID
            skip: Number of records to skip (pagination)
            limit: Max number of records to return
            recommendation: Filter by recommendation (BID, NO_BID, RESEARCH)
            min_fit_score: Minimum fit score

        Returns:
            List of Evaluation instances
        """
        query = db.query(Evaluation).filter(Evaluation.company_id == company_id)

        # Apply filters
        if recommendation:
            query = query.filter(Evaluation.recommendation == recommendation)

        if min_fit_score is not None:
            query = query.filter(Evaluation.fit_score >= min_fit_score)

        # Order by fit score descending
        query = query.order_by(desc(Evaluation.fit_score))

        return query.offset(skip).limit(limit).all()

    def get_opportunities_needing_evaluation(
        self,
        db: Session,
        company_id: str,
        limit: int = 50
    ) -> List[Opportunity]:
        """
        Get opportunities that match company's NAICS codes but haven't been evaluated yet

        Args:
            db: Database session
            company_id: Company ID
            limit: Max number of opportunities to return

        Returns:
            List of Opportunity instances
        """
        # Get company
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company or not company.naics_codes:
            return []

        # Get all opportunity IDs that already have evaluations for this company
        evaluated_opp_ids = db.query(Evaluation.opportunity_id).filter(
            Evaluation.company_id == company_id
        ).all()
        evaluated_opp_ids = [opp_id[0] for opp_id in evaluated_opp_ids]

        # Get active opportunities matching company's NAICS codes that haven't been evaluated
        query = db.query(Opportunity).filter(
            and_(
                Opportunity.status == "active",
                Opportunity.naics_code.in_(company.naics_codes),
                Opportunity.response_deadline >= datetime.utcnow(),
                Opportunity.id.notin_(evaluated_opp_ids)
            )
        ).order_by(desc(Opportunity.posted_date))

        return query.limit(limit).all()

    def delete_old_opportunities(self, db: Session, days_old: int = 90) -> int:
        """
        Delete opportunities older than specified days

        Args:
            db: Database session
            days_old: Delete opportunities older than this many days

        Returns:
            Number of opportunities deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        count = db.query(Opportunity).filter(
            Opportunity.response_deadline < cutoff_date
        ).delete()

        db.commit()
        logger.info(f"Deleted {count} old opportunities (older than {days_old} days)")
        return count


# Singleton instance
opportunity_service = OpportunityService()
