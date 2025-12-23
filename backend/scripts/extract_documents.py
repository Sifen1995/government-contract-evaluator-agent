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


def extract_pdf_text(file_path: str) -> tuple[Optional[str], Optional[float], bool]:
    """
    Extract text from a PDF file, using OCR for scanned pages.

    Returns:
        Tuple of (text, ocr_confidence, is_scanned)
    """
    # First try the OCR-enabled extraction
    try:
        from app.services.ocr import extract_text_with_ocr, check_ocr_system_dependencies

        # Check if OCR is available
        ocr_status = check_ocr_system_dependencies()
        if ocr_status['ready']:
            result = extract_text_with_ocr(file_path)
            if result:
                return result.text, result.confidence, result.is_scanned
            logger.warning("OCR extraction returned no results, falling back to basic extraction")
        else:
            logger.info("OCR not available, using basic PDF text extraction")
    except ImportError:
        logger.info("OCR service not available, using basic PDF text extraction")
    except Exception as e:
        logger.warning(f"OCR extraction failed: {e}, falling back to basic extraction")

    # Fallback to basic PyPDF2 extraction
    try:
        import PyPDF2

        text_parts = []
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        text = '\n\n'.join(text_parts) if text_parts else None
        return text, 100.0 if text else None, False  # 100% confidence for text-based PDFs
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return None, None, False


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
    """Use AI to extract entities from document text with enhanced extraction."""
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

        prompt = """Analyze the following document text and extract key business information for a government contracting company profile.

Return a JSON object with the following fields (use empty arrays/null if not found):

1. naics_codes: Array of 6-digit NAICS codes found (e.g., ["541511", "541512"]). Only include valid 6-digit codes.

2. certifications: Array of objects with certification details:
   [{"type": "8(a)" or "WOSB" or "SDVOSB" or "HUBZone" or "Small Business", "expiration_date": "YYYY-MM-DD" or null}]

3. key_capabilities: Array of specific capabilities/services the company provides (max 10 items)

4. company_info: Object with company details if found:
   {"name": string, "address": string, "city": string, "state": string, "zip": string, "uei": string}

5. past_performance: Array of contract details:
   [{"contract_number": string, "agency": string, "value_min": number, "value_max": number, "description": string}]

6. agencies: Array of government agency names mentioned

7. locations: Array of US state abbreviations where work was performed (e.g., ["DC", "VA", "MD"])

8. contract_value_range: Object with typical contract size:
   {"min": number, "max": number} - in dollars

9. duns_number: DUNS number if found (9 digits)

10. cage_code: CAGE code if found (5 characters)

Important:
- For NAICS codes, only extract valid 6-digit codes (e.g., 541511, not "IT Services")
- For certifications, normalize to standard types: "8(a)", "WOSB", "SDVOSB", "HUBZone", "Small Business"
- For dates, use ISO format YYYY-MM-DD
- For dollar amounts, extract as numbers without formatting (e.g., 1000000 not "$1M")

Document text:
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a document analyzer that extracts structured business information from government contracting documents. Extract NAICS codes as 6-digit numbers only. Normalize certification types to standard names. Always respond with valid JSON."},
                {"role": "user", "content": prompt + text}
            ],
            temperature=0.1,
            max_tokens=2000
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
    from decimal import Decimal

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
            text = None
            ocr_confidence = None
            is_scanned = False

            if document.file_type == "pdf":
                text, ocr_confidence, is_scanned = extract_pdf_text(tmp_path)
            elif document.file_type in ["docx", "doc"]:
                text = extract_docx_text(tmp_path)
                ocr_confidence = 100.0  # DOCX is always text-based
                is_scanned = False

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

            # Store OCR metadata
            if ocr_confidence is not None:
                document.ocr_confidence = Decimal(str(ocr_confidence))
            document.is_scanned = is_scanned

            # Reset suggestions_reviewed since new extraction available
            document.suggestions_reviewed = False

            db.commit()

            logger.info(f"Successfully processed document {document.id} (OCR: {is_scanned}, confidence: {ocr_confidence})")
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
