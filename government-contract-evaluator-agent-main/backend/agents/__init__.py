"""
GovAI Agents Module

This module contains AI-powered agents for automated government contract
discovery, evaluation, and notification.

Agents:
- DiscoveryAgent: Polls SAM.gov for new opportunities matching company profiles
- EvaluationAgent: Uses AI (GPT-4) to evaluate and score opportunities
- EmailAgent: Sends email notifications and digests to users
"""

from agents.discovery import DiscoveryAgent
from agents.evaluation import EvaluationAgent
from agents.email_agent import EmailAgent

__all__ = ["DiscoveryAgent", "EvaluationAgent", "EmailAgent"]
