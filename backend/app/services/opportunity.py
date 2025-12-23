"""
Opportunity and Evaluation CRUD service
"""
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
from app.models.company import Company
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class UpsertResult:
    """Result of batch upsert operation."""
    def __init__(self):
        self.new = 0
        self.updated = 0
        self.unchanged = 0
        self.errors = 0

    def to_dict(self) -> Dict:
        return {
            'new': self.new,
            'updated': self.updated,
            'unchanged': self.unchanged,
            'errors': self.errors,
            'total': self.new + self.updated + self.unchanged
        }


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
            logger.info(f"Opportunity {opportunity_data.get('source_id')} already exists, updating...")
            return self.update_opportunity(db, existing.id, opportunity_data)

        opportunity = Opportunity(**opportunity_data)
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)

        logger.info(f"Created opportunity {opportunity.source_id}")
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

        logger.info(f"Updated opportunity {opportunity.source_id}")
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
            'weaknesses', 'executive_summary', 'evaluated_at',
            'estimated_profit', 'profit_margin_percentage', 'cost_breakdown'
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
            'reasoning', 'strengths', 'weaknesses', 'executive_summary',
            'estimated_profit', 'profit_margin_percentage', 'cost_breakdown'
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

    def upsert_opportunities_batch(
        self,
        db: Session,
        opportunities_data: List[Dict]
    ) -> UpsertResult:
        """
        Efficiently upsert a batch of opportunities with deduplication.

        Uses source_id (SAM.gov notice ID) for deduplication.
        Only updates records if data has actually changed.

        Args:
            db: Database session
            opportunities_data: List of dicts with opportunity fields

        Returns:
            UpsertResult with counts of new, updated, unchanged, errors
        """
        result = UpsertResult()

        if not opportunities_data:
            return result

        # Extract all source_ids from incoming data
        source_ids = [
            opp.get('source_id') or opp.get('notice_id')
            for opp in opportunities_data
            if opp.get('source_id') or opp.get('notice_id')
        ]

        # Fetch all existing opportunities with these source_ids in one query
        existing_opps = {
            opp.source_id: opp
            for opp in db.query(Opportunity).filter(
                Opportunity.source_id.in_(source_ids)
            ).all()
        }

        for opp_data in opportunities_data:
            try:
                source_id = opp_data.get('source_id') or opp_data.get('notice_id')
                if not source_id:
                    result.errors += 1
                    continue

                existing = existing_opps.get(source_id)

                if existing:
                    # Check if data has changed
                    if self._has_opportunity_changed(existing, opp_data):
                        # Update existing record
                        for key, value in opp_data.items():
                            if hasattr(existing, key) and key not in ('id', 'created_at'):
                                setattr(existing, key, value)
                        existing.updated_at = datetime.utcnow()
                        result.updated += 1
                    else:
                        result.unchanged += 1
                else:
                    # Create new opportunity
                    # Ensure evaluation_status is set for new opportunities
                    if 'evaluation_status' not in opp_data:
                        opp_data['evaluation_status'] = 'pending'
                    opportunity = Opportunity(**opp_data)
                    db.add(opportunity)
                    result.new += 1

            except Exception as e:
                logger.error(f"Error upserting opportunity {opp_data.get('source_id')}: {e}")
                result.errors += 1
                continue

        # Commit all changes at once
        try:
            db.commit()
        except Exception as e:
            logger.error(f"Error committing batch upsert: {e}")
            db.rollback()
            raise

        logger.info(
            f"Batch upsert complete: {result.new} new, {result.updated} updated, "
            f"{result.unchanged} unchanged, {result.errors} errors"
        )
        return result

    def _has_opportunity_changed(self, existing: Opportunity, new_data: Dict) -> bool:
        """
        Check if any relevant fields have changed.

        Args:
            existing: Existing Opportunity from database
            new_data: New data dict from API

        Returns:
            True if data has changed, False otherwise
        """
        # Fields to compare for changes
        fields_to_check = [
            'title', 'description', 'response_deadline', 'status',
            'set_aside_type', 'estimated_value_low', 'estimated_value_high',
            'pop_city', 'pop_state', 'pop_zip', 'pop_country',
            'attachments'
        ]

        for field in fields_to_check:
            if field not in new_data:
                continue

            existing_value = getattr(existing, field, None)
            new_value = new_data.get(field)

            # Handle datetime comparison
            if isinstance(existing_value, datetime) and isinstance(new_value, datetime):
                # Compare without microseconds
                if existing_value.replace(microsecond=0) != new_value.replace(microsecond=0):
                    return True
            elif existing_value != new_value:
                return True

        return False

    def get_opportunities_pending_evaluation(
        self,
        db: Session,
        limit: int = 50
    ) -> List[Opportunity]:
        """
        Get opportunities that have not been generically evaluated yet.

        Args:
            db: Database session
            limit: Max number of opportunities to return

        Returns:
            List of Opportunity instances pending evaluation
        """
        return db.query(Opportunity).filter(
            and_(
                Opportunity.status == "active",
                Opportunity.response_deadline >= datetime.utcnow(),
                or_(
                    Opportunity.evaluation_status == 'pending',
                    Opportunity.evaluation_status.is_(None)
                )
            )
        ).order_by(desc(Opportunity.posted_date)).limit(limit).all()

    def mark_opportunity_evaluated(
        self,
        db: Session,
        opportunity_id: str,
        generic_evaluation: Dict
    ) -> Opportunity:
        """
        Mark an opportunity as generically evaluated.

        Args:
            db: Database session
            opportunity_id: ID of opportunity
            generic_evaluation: Dict with generic evaluation results

        Returns:
            Updated Opportunity instance
        """
        opportunity = db.query(Opportunity).filter(
            Opportunity.id == opportunity_id
        ).first()

        if not opportunity:
            raise ValueError(f"Opportunity {opportunity_id} not found")

        opportunity.evaluation_status = 'evaluated'
        opportunity.generic_evaluation = generic_evaluation
        opportunity.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(opportunity)

        return opportunity

    def get_evaluated_opportunities(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        naics_codes: Optional[List[str]] = None
    ) -> List[Opportunity]:
        """
        Get opportunities that have been generically evaluated.

        Args:
            db: Database session
            skip: Number to skip for pagination
            limit: Max number to return
            naics_codes: Optional NAICS code filter

        Returns:
            List of evaluated Opportunity instances
        """
        query = db.query(Opportunity).filter(
            and_(
                Opportunity.status == "active",
                Opportunity.evaluation_status == 'evaluated',
                Opportunity.response_deadline >= datetime.utcnow()
            )
        )

        if naics_codes:
            query = query.filter(Opportunity.naics_code.in_(naics_codes))

        return query.order_by(desc(Opportunity.posted_date)).offset(skip).limit(limit).all()


# Singleton instance
opportunity_service = OpportunityService()
