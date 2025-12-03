"""Embedding Generation Service - Creates vector embeddings for semantic search"""
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
import logging
from ..core.config import settings
from ..models.opportunity import Opportunity
from ..models.opportunity_embedding import OpportunityEmbedding
from ..models.company import Company

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and managing vector embeddings"""

    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "text-embedding-3-small"  # 1536 dimensions, cost-effective

    def extract_keywords(self, text: str, max_keywords: int = 20) -> List[str]:
        """Extract keywords from text using simple frequency analysis"""
        if not text:
            return []

        # Simple keyword extraction (can be improved with NLP libraries)
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }

        # Tokenize and clean
        words = text.lower().split()
        keywords = []

        for word in words:
            # Remove punctuation and filter
            cleaned = ''.join(c for c in word if c.isalnum())
            if len(cleaned) > 3 and cleaned not in stop_words:
                if cleaned not in keywords:
                    keywords.append(cleaned)

        return keywords[:max_keywords]

    def create_embedding_text(self, opportunity: Opportunity) -> str:
        """Create comprehensive text for embedding"""
        parts = []

        if opportunity.title:
            parts.append(f"Title: {opportunity.title}")

        if opportunity.agency:
            parts.append(f"Agency: {opportunity.agency}")

        if opportunity.naics_code:
            parts.append(f"NAICS: {opportunity.naics_code}")

        if opportunity.set_aside_type:
            parts.append(f"Set-Aside: {opportunity.set_aside_type}")

        if opportunity.description:
            # Truncate description to avoid token limits
            desc = opportunity.description[:2000]
            parts.append(f"Description: {desc}")

        return " | ".join(parts)

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector using OpenAI API"""
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=text,
                encoding_format="float"
            )

            return response.data[0].embedding

        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def embed_opportunity(self, db: Session, opportunity: Opportunity) -> Optional[OpportunityEmbedding]:
        """Create or update embedding for an opportunity"""

        # Check if embedding already exists
        existing = db.query(OpportunityEmbedding).filter(
            OpportunityEmbedding.opportunity_id == opportunity.id
        ).first()

        if existing:
            logger.info(f"Embedding already exists for opportunity {opportunity.id}")
            return existing

        # Create text for embedding
        embedding_text = self.create_embedding_text(opportunity)

        # Extract keywords
        keywords = self.extract_keywords(embedding_text)
        keywords_str = ",".join(keywords)

        # Generate embedding
        try:
            embedding_vector = self.generate_embedding(embedding_text)

            # Create embedding record
            opp_embedding = OpportunityEmbedding(
                opportunity_id=opportunity.id,
                embedding=embedding_vector,
                embedded_text=embedding_text,
                keywords=keywords_str
            )

            db.add(opp_embedding)
            db.commit()
            db.refresh(opp_embedding)

            logger.info(f"Created embedding for opportunity {opportunity.id}")
            return opp_embedding

        except Exception as e:
            logger.error(f"Failed to create embedding for {opportunity.id}: {e}")
            db.rollback()
            return None

    def embed_new_opportunities(self, db: Session, batch_size: int = 10) -> int:
        """Embed opportunities that don't have embeddings yet"""

        # Find opportunities without embeddings
        embedded_ids = db.query(OpportunityEmbedding.opportunity_id).all()
        embedded_ids = [e[0] for e in embedded_ids]

        query = db.query(Opportunity).filter(
            and_(
                Opportunity.status == "active",
                ~Opportunity.id.in_(embedded_ids) if embedded_ids else True
            )
        ).limit(batch_size)

        opportunities = query.all()

        embedded_count = 0
        for opp in opportunities:
            result = self.embed_opportunity(db, opp)
            if result:
                embedded_count += 1

        logger.info(f"Embedded {embedded_count}/{len(opportunities)} opportunities")
        return embedded_count

    def semantic_search(
        self,
        db: Session,
        company: Company,
        limit: int = 20
    ) -> List[Opportunity]:
        """Find opportunities semantically similar to company capabilities"""

        # Create embedding from company profile
        company_text = f"""
        Company: {company.name}
        NAICS Codes: {', '.join(company.naics_codes) if company.naics_codes else 'None'}
        Set-Asides: {', '.join(company.set_asides) if company.set_asides else 'None'}
        Capabilities: {company.capabilities or 'Not provided'}
        """

        try:
            query_embedding = self.generate_embedding(company_text)

            # Use pgvector similarity search (cosine distance)
            # Note: This requires pgvector extension in PostgreSQL
            results = db.query(
                Opportunity,
                OpportunityEmbedding.embedding.cosine_distance(query_embedding).label("distance")
            ).join(
                OpportunityEmbedding,
                Opportunity.id == OpportunityEmbedding.opportunity_id
            ).filter(
                Opportunity.status == "active"
            ).order_by(
                "distance"
            ).limit(limit).all()

            return [opp for opp, _ in results]

        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []
