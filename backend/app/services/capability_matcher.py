"""Capability Matching Service - Detailed matching between company and opportunity"""
from typing import Dict, List, Tuple
import re
from difflib import SequenceMatcher


class CapabilityMatcher:
    """Service for matching company capabilities with opportunity requirements"""

    def __init__(self):
        # Common government contracting capability keywords
        self.capability_keywords = {
            'it_services': ['software', 'development', 'programming', 'coding', 'IT', 'information technology', 'cybersecurity', 'network', 'cloud'],
            'engineering': ['engineering', 'design', 'CAD', 'technical', 'mechanical', 'electrical', 'civil'],
            'consulting': ['consulting', 'advisory', 'strategy', 'analysis', 'planning'],
            'construction': ['construction', 'building', 'renovation', 'facility', 'infrastructure'],
            'maintenance': ['maintenance', 'repair', 'support', 'upkeep', 'service'],
            'logistics': ['logistics', 'supply chain', 'transportation', 'distribution', 'warehouse'],
            'healthcare': ['healthcare', 'medical', 'health', 'clinical', 'hospital'],
            'research': ['research', 'R&D', 'development', 'innovation', 'study'],
            'training': ['training', 'education', 'instruction', 'teaching', 'learning'],
            'admin': ['administrative', 'clerical', 'office', 'documentation', 'records'],
        }

    def extract_capability_terms(self, text: str) -> List[str]:
        """Extract capability-related terms from text"""
        if not text:
            return []

        text_lower = text.lower()
        found_terms = []

        # Extract terms from predefined keywords
        for category, keywords in self.capability_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    found_terms.append(keyword)

        # Extract noun phrases (simple approach)
        # Remove common words and extract potential capability terms
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text)
        technical_words = [w for w in words if len(w) > 5 and w.lower() not in {'should', 'would', 'could', 'provide', 'include'}]

        found_terms.extend(technical_words[:20])  # Limit to 20 terms

        return list(set(found_terms))  # Remove duplicates

    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings"""
        if not text1 or not text2:
            return 0.0

        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

    def match_capabilities(
        self,
        company_capabilities: str,
        opportunity_description: str,
        opportunity_title: str = ""
    ) -> Dict[str, any]:
        """
        Match company capabilities with opportunity requirements

        Returns:
            {
                'match_score': float (0-100),
                'matching_terms': List[str],
                'missing_terms': List[str],
                'overlap_percentage': float,
                'category_matches': Dict[str, bool]
            }
        """
        # Extract terms
        company_terms = self.extract_capability_terms(company_capabilities)
        opp_terms = self.extract_capability_terms(opportunity_description + " " + opportunity_title)

        # Find overlapping terms
        company_terms_lower = [t.lower() for t in company_terms]
        opp_terms_lower = [t.lower() for t in opp_terms]

        matching_terms = [t for t in company_terms if t.lower() in opp_terms_lower]
        missing_terms = [t for t in opp_terms if t.lower() not in company_terms_lower]

        # Calculate overlap
        if not opp_terms:
            overlap_percentage = 0.0
        else:
            overlap_percentage = (len(matching_terms) / len(opp_terms)) * 100

        # Check category matches
        category_matches = {}
        for category, keywords in self.capability_keywords.items():
            company_has = any(k.lower() in company_capabilities.lower() for k in keywords)
            opp_needs = any(k.lower() in opportunity_description.lower() for k in keywords)
            category_matches[category] = company_has and opp_needs

        # Calculate overall match score
        # Weighted scoring:
        # - 40% text similarity
        # - 30% term overlap
        # - 30% category matches
        text_sim = self.calculate_text_similarity(company_capabilities, opportunity_description)
        category_match_rate = sum(category_matches.values()) / len(category_matches) if category_matches else 0

        match_score = (
            text_sim * 40 +
            (overlap_percentage / 100) * 30 +
            category_match_rate * 30
        )

        return {
            'match_score': round(match_score, 2),
            'matching_terms': matching_terms[:10],  # Top 10
            'missing_terms': missing_terms[:5],  # Top 5 gaps
            'overlap_percentage': round(overlap_percentage, 2),
            'category_matches': {k: v for k, v in category_matches.items() if v},
            'text_similarity': round(text_sim, 2)
        }

    def generate_capability_narrative(self, match_result: Dict) -> str:
        """Generate a human-readable narrative of capability match"""
        score = match_result['match_score']
        matching = match_result['matching_terms']
        missing = match_result['missing_terms']
        categories = match_result['category_matches']

        narrative_parts = []

        # Overall assessment
        if score >= 75:
            narrative_parts.append("Strong capability alignment.")
        elif score >= 50:
            narrative_parts.append("Moderate capability alignment.")
        else:
            narrative_parts.append("Limited capability alignment.")

        # Matching terms
        if matching:
            terms_str = ", ".join(matching[:3])
            narrative_parts.append(f"Company demonstrates experience in {terms_str}.")

        # Categories
        if categories:
            cat_str = ", ".join(categories.keys())
            narrative_parts.append(f"Relevant expertise areas: {cat_str}.")

        # Gaps
        if missing:
            gaps_str = ", ".join(missing[:3])
            narrative_parts.append(f"May need to address: {gaps_str}.")

        return " ".join(narrative_parts)
