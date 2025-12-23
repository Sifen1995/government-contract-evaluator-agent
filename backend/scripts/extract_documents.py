#!/usr/bin/env python3
"""
Standalone script for extracting text from uploaded documents.
Processes pending documents and extracts text/entities using AI.

Usage:
    python scripts/extract_documents.py

Cron entry (every 5 minutes):
    */5 * * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/extract_documents.py >> /var/log/govai/extraction.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
import json
from datetime import datetime
from typing import Optional

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.document import Document

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def extract_pdf_text(file_path: str) -> Optional[str]:
    """Extract text from a PDF file."""
    try:
        import PyPDF2

        text_parts = []
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        return '\n\n'.join(text_parts) if text_parts else None
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return None


def extract_docx_text(file_path: str) -> Optional[str]:
    """Extract text from a DOCX file."""
    try:
        from docx import Document as DocxDocument

        doc = DocxDocument(file_path)
        text_parts = []
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)

        return '\n\n'.join(text_parts) if text_parts else None
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        return None


def extract_entities_with_ai(text: str) -> dict:
    """Use AI to extract entities from document text."""
    try:
        import openai

        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured, skipping entity extraction")
            return {}

        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

        # Truncate text if too long
        max_chars = 15000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."

        prompt = """Analyze the following document text and extract key business information.
Return a JSON object with the following fields (leave empty if not found):
- naics_codes: list of NAICS codes mentioned
- agencies: list of government agency names
- contract_values: list of contract values/amounts
- certifications: list of certifications mentioned (8(a), WOSB, SDVOSB, HUBZone, etc.)
- key_capabilities: list of key capabilities/services
- past_performance_contracts: list of contract numbers mentioned
- locations: list of locations/states mentioned

Document text:
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a document analyzer that extracts structured business information from government contracting documents. Always respond with valid JSON."},
                {"role": "user", "content": prompt + text}
            ],
            temperature=0.1,
            max_tokens=1000
        )

        content = response.choices[0].message.content.strip()

        # Try to parse JSON from response
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        return {}
    except Exception as e:
        logger.error(f"Error in AI entity extraction: {e}")
        return {}


def download_from_s3(s3_key: str, local_path: str) -> bool:
    """Download a file from S3 to local path."""
    try:
        import boto3

        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )

        s3_client.download_file(settings.S3_BUCKET_NAME, s3_key, local_path)
        return True
    except Exception as e:
        logger.error(f"Error downloading from S3: {e}")
        return False


def process_document(db, document: Document) -> bool:
    """Process a single document for text extraction."""
    import tempfile

    try:
        # Update status to processing
        document.extraction_status = "processing"
        db.commit()

        # Create temp file
        suffix = f".{document.file_type}"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp_path = tmp.name

        try:
            # Download from S3
            if not download_from_s3(document.s3_key, tmp_path):
                raise Exception("Failed to download from S3")

            # Extract text based on file type
            if document.file_type == "pdf":
                text = extract_pdf_text(tmp_path)
            elif document.file_type in ["docx", "doc"]:
                text = extract_docx_text(tmp_path)
            else:
                text = None

            if not text:
                logger.warning(f"No text extracted from document {document.id}")
                document.extraction_status = "failed"
                db.commit()
                return False

            # Extract entities using AI
            entities = extract_entities_with_ai(text)

            # Update document with extracted data
            document.extracted_text = text[:50000]  # Limit stored text
            document.extracted_entities = entities
            document.extraction_status = "completed"
            db.commit()

            logger.info(f"Successfully processed document {document.id}")
            return True

        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except Exception as e:
        logger.error(f"Error processing document {document.id}: {e}")
        document.extraction_status = "failed"
        db.commit()
        return False


def extract_pending_documents():
    """Process all pending documents."""
    db = SessionLocal()
    try:
        logger.info("Starting document extraction task...")

        # Get pending documents
        pending_docs = db.query(Document).filter(
            Document.extraction_status == "pending",
            Document.is_deleted == False
        ).limit(10).all()  # Process 10 at a time

        if not pending_docs:
            logger.info("No pending documents to process")
            return {"processed": 0, "success": 0, "failed": 0}

        success = 0
        failed = 0

        for doc in pending_docs:
            if process_document(db, doc):
                success += 1
            else:
                failed += 1

        logger.info(f"Document extraction completed: {success} success, {failed} failed")
        return {"processed": len(pending_docs), "success": success, "failed": failed}

    except Exception as e:
        logger.error(f"Error in document extraction task: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Document extraction job started at {start_time} ===")

    try:
        result = extract_pending_documents()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Document extraction job completed in {duration:.2f} seconds ===")
