"""Embedding Agent - Generates embeddings for new opportunities"""
from app.core.database import SessionLocal
from app.services.embeddings import EmbeddingService
import logging

logger = logging.getLogger(__name__)


def run_embedding_generation():
    """Run embedding generation for new opportunities (called by Celery)"""
    db = SessionLocal()
    try:
        service = EmbeddingService()
        count = service.embed_new_opportunities(db, batch_size=50)
        logger.info(f"Embedding generation completed: {count} opportunities embedded")
        return count
    except Exception as e:
        logger.error(f"Error in embedding generation: {e}")
        raise
    finally:
        db.close()
