"""AI Evaluation Agent - Evaluates opportunities using GPT-4 or Claude"""
import openai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.opportunity import Opportunity
from app.models.company import Company
from app.models.evaluation import Evaluation
from sqlalchemy import and_
import json
import logging

logger = logging.getLogger(__name__)

openai.api_key = settings.OPENAI_API_KEY


class EvaluationAgent:
    """Agent for AI-powered opportunity evaluation"""

    def __init__(self):
        self.model = settings.OPENAI_MODEL

    def build_evaluation_prompt(self, company: Company, opportunity: Opportunity) -> str:
        """Build the evaluation prompt"""
        prompt = f"""You are an expert government contracting capture manager.

COMPANY PROFILE:
- Name: {company.name}
- NAICS Codes: {', '.join(company.naics_codes) if company.naics_codes else 'None'}
- Set-Aside Certifications: {', '.join(company.set_asides) if company.set_asides else 'None'}
- Capabilities: {company.capabilities or 'Not provided'}
- Typical Contract Value: ${company.contract_value_min} - ${company.contract_value_max}

OPPORTUNITY:
- Title: {opportunity.title}
- Agency: {opportunity.agency}
- NAICS: {opportunity.naics_code}
- Set-Aside: {opportunity.set_aside_type or 'None'}
- Estimated Value: ${opportunity.estimated_value_low} - ${opportunity.estimated_value_high}
- Deadline: {opportunity.response_deadline}
- Description: {opportunity.description[:1000] if opportunity.description else 'Not provided'}

Evaluate this opportunity and respond ONLY with valid JSON in this exact format:

{{
    "fit_score": <0-100>,
    "win_probability": <0-100>,
    "recommendation": "BID" | "NO_BID" | "REVIEW",
    "confidence": <0-100>,
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2"],
    "executive_summary": "2-3 sentence recommendation"
}}

Scoring criteria:
- FIT SCORE: NAICS match (30), Set-aside match (25), Value fit (20), Capability match (25)
- WIN PROBABILITY: Based on fit, competition level, and set-aside advantage
- RECOMMENDATION: BID if score >75, NO_BID if <50, REVIEW if 50-75"""

        return prompt

    def evaluate_opportunity(self, db: Session, opportunity: Opportunity, company: Company) -> Evaluation:
        """Evaluate a single opportunity for a company"""

        # Check if evaluation already exists
        existing = db.query(Evaluation).filter(
            and_(
                Evaluation.opportunity_id == opportunity.id,
                Evaluation.company_id == company.id
            )
        ).first()

        if existing:
            logger.info(f"Evaluation already exists for opp {opportunity.id}, company {company.id}")
            return existing

        # Build prompt
        prompt = self.build_evaluation_prompt(company, opportunity)

        try:
            # Call OpenAI API
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert government contracting evaluator. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            # Parse response
            content = response.choices[0].message.content
            eval_data = json.loads(content)

            # Create evaluation
            evaluation = Evaluation(
                opportunity_id=opportunity.id,
                company_id=company.id,
                fit_score=eval_data["fit_score"],
                win_probability=eval_data["win_probability"],
                recommendation=eval_data["recommendation"],
                confidence=eval_data.get("confidence", 80),
                strengths=eval_data["strengths"],
                weaknesses=eval_data["weaknesses"],
                executive_summary=eval_data["executive_summary"]
            )

            db.add(evaluation)
            db.commit()
            db.refresh(evaluation)

            logger.info(f"Created evaluation for opp {opportunity.id}, score: {evaluation.fit_score}")

            return evaluation

        except Exception as e:
            logger.error(f"Error evaluating opportunity {opportunity.id}: {e}")
            # Create fallback evaluation
            evaluation = Evaluation(
                opportunity_id=opportunity.id,
                company_id=company.id,
                fit_score=50,
                win_probability=50,
                recommendation="REVIEW",
                confidence=50,
                strengths=["Unable to evaluate automatically"],
                weaknesses=["Evaluation failed, manual review required"],
                executive_summary="Automatic evaluation failed. Please review manually."
            )

            db.add(evaluation)
            db.commit()
            db.refresh(evaluation)

            return evaluation

    def evaluate_new_opportunities(self, db: Session):
        """Evaluate all new opportunities for all companies"""
        companies = db.query(Company).all()

        if not companies:
            logger.info("No companies found, skipping evaluation")
            return

        evaluated_count = 0

        for company in companies:
            # Get opportunities matching company's NAICS codes
            opportunities = db.query(Opportunity).filter(
                and_(
                    Opportunity.status == "active",
                    Opportunity.naics_code.in_(company.naics_codes) if company.naics_codes else True
                )
            ).all()

            for opp in opportunities:
                # Check if already evaluated
                existing = db.query(Evaluation).filter(
                    and_(
                        Evaluation.opportunity_id == opp.id,
                        Evaluation.company_id == company.id
                    )
                ).first()

                if not existing:
                    self.evaluate_opportunity(db, opp, company)
                    evaluated_count += 1

        logger.info(f"Evaluation completed: {evaluated_count} opportunities evaluated")
        return evaluated_count


def run_evaluation():
    """Run evaluation agent (called by Celery)"""
    db = SessionLocal()
    try:
        agent = EvaluationAgent()
        agent.evaluate_new_opportunities(db)
    finally:
        db.close()
