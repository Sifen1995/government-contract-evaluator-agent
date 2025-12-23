"""
Re-scoring Service

Handles dynamic re-evaluation of opportunities when company profiles change.

Reference: TICKET-027, TICKET-028, TICKET-029 from IMPLEMENTATION_TICKETS.md
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging

from app.models.company import Company
from app.models.evaluation import Evaluation

logger = logging.getLogger(__name__)

# Fields that affect scoring - changes to these trigger profile version increment
SCORING_RELEVANT_FIELDS = {
    'naics_codes',
    'set_asides',
    'geographic_preferences',
    'contract_value_min',
    'contract_value_max',
    'capabilities',
}


class RescoringService:
    """Service for managing evaluation re-scoring."""

    def check_scoring_fields_changed(
        self,
        old_data: dict,
        new_data: dict
    ) -> bool:
        """
        Check if any scoring-relevant fields have changed.

        Args:
            old_data: Previous company data
            new_data: New company data

        Returns:
            True if scoring-relevant fields changed
        """
        for field in SCORING_RELEVANT_FIELDS:
            old_val = old_data.get(field)
            new_val = new_data.get(field)
            if old_val != new_val:
                logger.info(f"Scoring field changed: {field}")
                return True
        return False

    def increment_profile_version(self, db: Session, company: Company) -> int:
        """
        Increment company's profile version.

        Args:
            db: Database session
            company: Company to update

        Returns:
            New version number
        """
        company.profile_version = (company.profile_version or 0) + 1
        db.commit()
        logger.info(f"Company {company.id} profile version incremented to {company.profile_version}")
        return company.profile_version

    def get_stale_evaluations(
        self,
        db: Session,
        company_id: UUID
    ) -> List[Evaluation]:
        """
        Get all stale evaluations for a company.

        Args:
            db: Database session
            company_id: Company UUID

        Returns:
            List of stale evaluations
        """
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return []

        return db.query(Evaluation).filter(
            and_(
                Evaluation.company_id == company_id,
                (Evaluation.profile_version_at_evaluation < company.profile_version) |
                (Evaluation.profile_version_at_evaluation.is_(None))
            )
        ).all()

    def get_stale_count(self, db: Session, company_id: UUID) -> int:
        """
        Get count of stale evaluations for a company.

        Args:
            db: Database session
            company_id: Company UUID

        Returns:
            Count of stale evaluations
        """
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return 0

        return db.query(Evaluation).filter(
            and_(
                Evaluation.company_id == company_id,
                (Evaluation.profile_version_at_evaluation < company.profile_version) |
                (Evaluation.profile_version_at_evaluation.is_(None))
            )
        ).count()

    async def refresh_evaluation(
        self,
        db: Session,
        evaluation: Evaluation
    ) -> Evaluation:
        """
        Refresh a single evaluation with current profile.

        Args:
            db: Database session
            evaluation: Evaluation to refresh

        Returns:
            Updated evaluation
        """
        company = evaluation.company

        # Import here to avoid circular imports
        from app.services.ai_evaluator import ai_evaluator_service

        try:
            # Re-evaluate with AI
            result = await ai_evaluator_service.evaluate_opportunity(
                evaluation.opportunity,
                company
            )

            # Update evaluation
            evaluation.fit_score = result.get('fit_score')
            evaluation.win_probability = result.get('win_probability')
            evaluation.recommendation = result.get('recommendation')
            evaluation.confidence = result.get('confidence')
            evaluation.reasoning = result.get('reasoning')
            evaluation.strengths = result.get('strengths')
            evaluation.weaknesses = result.get('weaknesses')
            evaluation.executive_summary = result.get('executive_summary')
            evaluation.profile_version_at_evaluation = company.profile_version
            evaluation.evaluated_at = datetime.utcnow()

            db.commit()
            db.refresh(evaluation)

            logger.info(f"Refreshed evaluation {evaluation.id}")
            return evaluation

        except Exception as e:
            logger.error(f"Error refreshing evaluation {evaluation.id}: {e}")
            raise

    async def rescore_all_evaluations(
        self,
        db: Session,
        company_id: UUID,
        max_evaluations: Optional[int] = None
    ) -> dict:
        """
        Re-score all stale evaluations for a company.

        Args:
            db: Database session
            company_id: Company UUID
            max_evaluations: Optional limit on evaluations to rescore

        Returns:
            Dict with rescored count and errors
        """
        stale_evaluations = self.get_stale_evaluations(db, company_id)

        if max_evaluations:
            stale_evaluations = stale_evaluations[:max_evaluations]

        rescored = 0
        errors = 0

        for evaluation in stale_evaluations:
            try:
                await self.refresh_evaluation(db, evaluation)
                rescored += 1
            except Exception as e:
                logger.error(f"Error rescoring evaluation {evaluation.id}: {e}")
                errors += 1

        return {
            "rescored": rescored,
            "errors": errors,
            "total": len(stale_evaluations)
        }

    def mark_evaluation_current(
        self,
        db: Session,
        evaluation: Evaluation,
        company: Company
    ):
        """
        Mark an evaluation as current (when newly created or updated).

        Args:
            db: Database session
            evaluation: Evaluation to mark
            company: Company with current profile version
        """
        evaluation.profile_version_at_evaluation = company.profile_version
        db.commit()


# Global service instance
rescoring_service = RescoringService()
