"""
Evaluation Agent - AI-Powered Opportunity Scoring Agent

This agent is responsible for:
- Evaluating government contract opportunities using GPT-4
- Generating fit scores and win probability estimates
- Providing BID/NO_BID/RESEARCH recommendations
- Analyzing strengths, weaknesses, and risk factors
"""

from typing import Dict, List, Optional
from datetime import datetime
import asyncio
import logging

from app.core.database import SessionLocal
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
from app.services.ai_evaluator import ai_evaluator_service
from app.services.opportunity import opportunity_service

logger = logging.getLogger(__name__)


class EvaluationAgent:
    """
    Agent for AI-powered evaluation of government contract opportunities.

    This agent:
    1. Identifies opportunities that need evaluation for each company
    2. Uses GPT-4 to analyze opportunity-company fit
    3. Generates detailed evaluation reports with scores and recommendations
    4. Stores evaluations for user review
    """

    def __init__(self, db_session=None):
        """
        Initialize the Evaluation Agent.

        Args:
            db_session: Optional SQLAlchemy session. If not provided,
                       a new session will be created.
        """
        self.db = db_session
        self._owns_session = db_session is None

    def __enter__(self):
        if self._owns_session:
            self.db = SessionLocal()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._owns_session and self.db:
            self.db.close()

    def get_companies_needing_evaluation(self) -> List[Company]:
        """
        Get all companies with NAICS codes that may have opportunities
        needing evaluation.

        Returns:
            List of Company objects
        """
        companies = self.db.query(Company).filter(
            Company.naics_codes.isnot(None)
        ).all()

        return companies

    def get_unevaluated_opportunities(
        self,
        company: Company,
        limit: int = 50
    ) -> List[Opportunity]:
        """
        Get opportunities that haven't been evaluated for a company.

        Args:
            company: The company to check evaluations for
            limit: Maximum number of opportunities to return

        Returns:
            List of Opportunity objects needing evaluation
        """
        return opportunity_service.get_opportunities_needing_evaluation(
            self.db,
            company.id,
            limit=limit
        )

    async def evaluate_opportunity(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> Dict:
        """
        Evaluate a single opportunity for a company using AI.

        Args:
            opportunity: The opportunity to evaluate
            company: The company profile

        Returns:
            Dict with evaluation results including:
            - fit_score: 0-100 score
            - win_probability: 0-100 estimate
            - recommendation: BID, NO_BID, or RESEARCH
            - strengths: List of strengths
            - weaknesses: List of weaknesses
            - key_requirements: List of key requirements
            - missing_capabilities: List of gaps
            - reasoning: Detailed explanation
            - risk_factors: List of risks
        """
        try:
            evaluation_data = await ai_evaluator_service.evaluate_opportunity(
                opportunity,
                company
            )

            logger.info(
                f"Evaluated opportunity {opportunity.notice_id} for company {company.id}: "
                f"{evaluation_data.get('recommendation')} (fit: {evaluation_data.get('fit_score')}%)"
            )

            return evaluation_data

        except Exception as e:
            logger.error(f"Error evaluating opportunity: {str(e)}")
            raise

    def save_evaluation(
        self,
        opportunity: Opportunity,
        company: Company,
        evaluation_data: Dict
    ) -> Evaluation:
        """
        Save an evaluation to the database.

        Args:
            opportunity: The evaluated opportunity
            company: The company profile
            evaluation_data: Dict with evaluation results

        Returns:
            Created Evaluation object
        """
        eval_record = {
            "opportunity_id": opportunity.id,
            "company_id": company.id,
            **evaluation_data
        }

        return opportunity_service.create_evaluation(self.db, eval_record)

    def evaluate_for_company(
        self,
        company: Company,
        limit: int = 50
    ) -> Dict:
        """
        Evaluate all pending opportunities for a single company.

        Args:
            company: The company to evaluate for
            limit: Maximum opportunities to evaluate

        Returns:
            Dict with evaluation statistics
        """
        opportunities = self.get_unevaluated_opportunities(company, limit)

        if not opportunities:
            return {
                "company_id": str(company.id),
                "company_name": company.name,
                "evaluated": 0,
                "errors": 0
            }

        evaluated = 0
        errors = 0

        for opportunity in opportunities:
            try:
                # Evaluate using AI
                eval_data = asyncio.run(
                    self.evaluate_opportunity(opportunity, company)
                )

                # Save evaluation
                self.save_evaluation(opportunity, company, eval_data)
                evaluated += 1

            except Exception as e:
                logger.error(
                    f"Error evaluating opportunity {opportunity.id} "
                    f"for company {company.id}: {str(e)}"
                )
                errors += 1
                continue

        return {
            "company_id": str(company.id),
            "company_name": company.name,
            "evaluated": evaluated,
            "errors": errors
        }

    def run_evaluations(self, company_id: Optional[str] = None) -> Dict:
        """
        Run evaluations for all companies or a specific company.

        Args:
            company_id: Optional company ID to evaluate for.
                       If None, evaluates for all companies.

        Returns:
            Dict with overall evaluation statistics
        """
        logger.info(f"Starting evaluations for company_id={company_id or 'all'}")

        if company_id:
            companies = self.db.query(Company).filter(
                Company.id == company_id
            ).all()
        else:
            companies = self.get_companies_needing_evaluation()

        if not companies:
            logger.info("No companies found for evaluation")
            return {
                "companies": 0,
                "total_evaluated": 0,
                "total_errors": 0
            }

        total_evaluated = 0
        total_errors = 0
        company_results = []

        for company in companies:
            result = self.evaluate_for_company(company)
            total_evaluated += result["evaluated"]
            total_errors += result["errors"]
            company_results.append(result)

            logger.info(
                f"Evaluated {result['evaluated']} opportunities for {company.name}"
            )

        logger.info(
            f"Evaluation complete: {total_evaluated} evaluations, {total_errors} errors"
        )

        return {
            "companies": len(companies),
            "total_evaluated": total_evaluated,
            "total_errors": total_errors,
            "results_by_company": company_results
        }


def run_evaluation_agent(company_id: Optional[str] = None) -> Dict:
    """
    Convenience function to run the evaluation agent.

    This function is called by the Celery task.

    Args:
        company_id: Optional company ID to evaluate for

    Returns:
        Dict with evaluation statistics
    """
    with EvaluationAgent() as agent:
        return agent.run_evaluations(company_id)
