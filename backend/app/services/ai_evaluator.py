"""
AI-powered opportunity evaluation service using OpenAI GPT-4
"""
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.opportunity import Opportunity
from app.models.company import Company
import logging
import json
import time

logger = logging.getLogger(__name__)


class AIEvaluatorService:
    """Service for evaluating opportunities using AI"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")

        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "gpt-4"  # Use GPT-4 for best quality

    async def evaluate_opportunity(
        self,
        opportunity: Opportunity,
        company: Company
    ) -> Dict:
        """
        Evaluate an opportunity for a company using AI

        Args:
            opportunity: The opportunity to evaluate
            company: The company profile

        Returns:
            Dict with evaluation results (fit_score, win_probability, recommendation, etc.)
        """
        start_time = time.time()

        try:
            # Build the evaluation prompt
            prompt = self._build_evaluation_prompt(opportunity, company)

            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent evaluations
                max_tokens=2000,
                response_format={"type": "json_object"}  # Force JSON response
            )

            # Parse response
            content = response.choices[0].message.content
            evaluation_data = json.loads(content)

            # Calculate evaluation time
            evaluation_time = time.time() - start_time

            # Add metadata
            evaluation_data["model_version"] = self.model
            evaluation_data["tokens_used"] = response.usage.total_tokens
            evaluation_data["evaluation_time_seconds"] = round(evaluation_time, 2)

            logger.info(
                f"Evaluated opportunity {opportunity.notice_id} for company {company.id}: "
                f"{evaluation_data.get('recommendation')} (fit: {evaluation_data.get('fit_score')}%)"
            )

            return evaluation_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            raise Exception("AI returned invalid response format")
        except Exception as e:
            logger.error(f"Error evaluating opportunity: {str(e)}")
            raise

    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI evaluator"""
        return """You are an expert government contracting advisor helping small businesses evaluate opportunities.

Your task is to analyze a government contract opportunity and a company's profile to provide:
1. A fit score (0-100): How well the company matches this opportunity
2. A win probability (0-100): The estimated likelihood of winning this contract
3. A recommendation: BID, NO_BID, or RESEARCH
4. Detailed analysis including strengths, weaknesses, key requirements, and missing capabilities

Consider these factors:
- NAICS code alignment (exact match vs. similar)
- Set-aside eligibility (if opportunity has set-aside, does company qualify?)
- Geographic location and company's preferences
- Contract value vs. company's typical range
- Company's stated capabilities vs. opportunity requirements
- Competition level (implied by set-aside type and contract value)
- Past performance requirements (if mentioned)
- Technical complexity vs. company's capabilities

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "fit_score": <number 0-100>,
  "win_probability": <number 0-100>,
  "recommendation": "<BID|NO_BID|RESEARCH>",
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "key_requirements": ["requirement 1", "requirement 2", ...],
  "missing_capabilities": ["missing 1", "missing 2", ...],
  "reasoning": "<detailed explanation of your evaluation>",
  "risk_factors": ["risk 1", "risk 2", ...],
  "naics_match": <0|1|2>,
  "set_aside_match": <0|1>,
  "geographic_match": <0|1>,
  "contract_value_match": <0|1>
}

Match score explanations:
- naics_match: 0 = no match, 1 = related NAICS, 2 = exact match
- set_aside_match: 0 = company doesn't qualify, 1 = company qualifies (or no set-aside)
- geographic_match: 0 = outside preferences, 1 = within preferences
- contract_value_match: 0 = outside company's range, 1 = within range

Recommendation guidelines:
- BID: fit_score >= 70, win_probability >= 40, all critical requirements met
- NO_BID: fit_score < 50 OR major capability gaps OR clearly not qualified
- RESEARCH: fit_score 50-69 OR missing information to make decision"""

    def _build_evaluation_prompt(self, opportunity: Opportunity, company: Company) -> str:
        """Build the evaluation prompt with opportunity and company details"""

        # Format company NAICS codes
        company_naics = ", ".join(company.naics_codes) if company.naics_codes else "None specified"

        # Format company set-asides
        company_set_asides = ", ".join(company.set_asides) if company.set_asides else "None"

        # Format geographic preferences
        geo_prefs = company.geographic_preferences or []
        if "Nationwide" in geo_prefs:
            company_geography = "Nationwide (willing to work anywhere)"
        elif geo_prefs:
            company_geography = ", ".join(geo_prefs)
        else:
            company_geography = "Not specified"

        # Format contract value range
        if company.contract_value_min and company.contract_value_max:
            company_value_range = f"${company.contract_value_min:,.0f} - ${company.contract_value_max:,.0f}"
        else:
            company_value_range = "Not specified"

        # Build the prompt
        prompt = f"""Please evaluate this government contracting opportunity for my company.

OPPORTUNITY DETAILS:
- Notice ID: {opportunity.notice_id}
- Title: {opportunity.title}
- Description: {opportunity.description or 'Not provided'}
- Department: {opportunity.department or 'Unknown'}
- Office: {opportunity.office or 'Unknown'}
- NAICS Code: {opportunity.naics_code} - {opportunity.naics_description or 'Unknown'}
- Set-Aside: {opportunity.set_aside or 'Full and Open Competition (no set-aside)'}
- Response Deadline: {opportunity.response_deadline.strftime('%Y-%m-%d') if opportunity.response_deadline else 'Not specified'}
- Location: {opportunity.place_of_performance_city or 'Unknown'}, {opportunity.place_of_performance_state or 'Unknown'}
- Type: {opportunity.type or 'Unknown'}

COMPANY PROFILE:
- Name: {company.name}
- Legal Structure: {company.legal_structure or 'Not specified'}
- NAICS Codes: {company_naics}
- Set-Aside Certifications: {company_set_asides}
- Geographic Preferences: {company_geography}
- Contract Value Range: {company_value_range}
- Capabilities Statement:
{company.capabilities or 'No capabilities statement provided'}

Please provide your evaluation in the specified JSON format."""

        return prompt

    def calculate_basic_match_scores(self, opportunity: Opportunity, company: Company) -> Dict:
        """
        Calculate basic match scores without AI (used as fallback or for simple matching)

        Args:
            opportunity: The opportunity
            company: The company

        Returns:
            Dict with match scores
        """
        # NAICS match
        naics_match = 0
        if opportunity.naics_code and company.naics_codes:
            if opportunity.naics_code in company.naics_codes:
                naics_match = 2  # Exact match
            elif any(opportunity.naics_code[:4] == code[:4] for code in company.naics_codes):
                naics_match = 1  # Same industry (first 4 digits match)

        # Set-aside match
        set_aside_match = 1  # Default to match if no set-aside
        if opportunity.set_aside and opportunity.set_aside != "Full and Open Competition":
            # Normalize set-aside names
            opp_set_aside = opportunity.set_aside.lower()
            company_set_asides_lower = [s.lower() for s in (company.set_asides or [])]

            if any(s in opp_set_aside for s in ["8(a)", "8a"]):
                set_aside_match = 1 if "8(a)" in company.set_asides else 0
            elif "wosb" in opp_set_aside or "women" in opp_set_aside:
                set_aside_match = 1 if any("wosb" in s or "edwosb" in s for s in company_set_asides_lower) else 0
            elif "sdvosb" in opp_set_aside or "service-disabled" in opp_set_aside:
                set_aside_match = 1 if "sdvosb" in company_set_asides_lower else 0
            elif "vosb" in opp_set_aside and "sdvosb" not in opp_set_aside:
                set_aside_match = 1 if any("vosb" in s for s in company_set_asides_lower) else 0
            elif "hubzone" in opp_set_aside:
                set_aside_match = 1 if "hubzone" in company_set_asides_lower else 0
            elif "small business" in opp_set_aside:
                set_aside_match = 1 if "small business" in company_set_asides_lower else 0

        # Geographic match
        geographic_match = 0
        geo_prefs = company.geographic_preferences or []
        if "Nationwide" in geo_prefs:
            geographic_match = 1
        elif opportunity.place_of_performance_state and opportunity.place_of_performance_state in geo_prefs:
            geographic_match = 1

        # Contract value match
        contract_value_match = 0
        if opportunity.contract_value and company.contract_value_min and company.contract_value_max:
            if company.contract_value_min <= opportunity.contract_value <= company.contract_value_max:
                contract_value_match = 1

        return {
            "naics_match": naics_match,
            "set_aside_match": set_aside_match,
            "geographic_match": geographic_match,
            "contract_value_match": contract_value_match
        }


# Singleton instance
ai_evaluator_service = AIEvaluatorService()
