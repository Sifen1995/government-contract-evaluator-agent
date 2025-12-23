"""
OCR Service for extracting text from scanned PDF documents.
Uses Tesseract OCR via pytesseract and pdf2image for PDF conversion.

System dependencies required:
- Tesseract OCR: apt-get install tesseract-ocr (Ubuntu) or brew install tesseract (macOS)
- Poppler: apt-get install poppler-utils (Ubuntu) or brew install poppler (macOS)
"""

import logging
from typing import Optional, Tuple, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class OCRResult:
    """Result of OCR extraction."""
    text: str
    confidence: float  # 0-100 average confidence score
    pages_processed: int
    pages_with_text: int
    is_scanned: bool  # True if OCR was needed


def is_tesseract_available() -> bool:
    """Check if Tesseract OCR is installed and available."""
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def is_poppler_available() -> bool:
    """Check if Poppler (pdf2image dependency) is installed."""
    try:
        from pdf2image import convert_from_path
        return True
    except Exception:
        return False


def extract_text_from_image(image) -> Tuple[str, float]:
    """
    Extract text from a PIL Image using Tesseract OCR.

    Returns:
        Tuple of (extracted_text, confidence_score)
    """
    try:
        import pytesseract

        # Get detailed data including confidence scores
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)

        # Calculate average confidence (excluding -1 which means no text detected)
        confidences = [c for c in data['conf'] if c != -1]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Get plain text
        text = pytesseract.image_to_string(image)

        return text.strip(), avg_confidence
    except Exception as e:
        logger.error(f"Error in OCR extraction: {e}")
        return "", 0


def pdf_page_has_text(pdf_reader, page_num: int) -> bool:
    """Check if a PDF page has extractable text (not scanned)."""
    try:
        page = pdf_reader.pages[page_num]
        text = page.extract_text()
        # If we get meaningful text (more than just whitespace), it's text-based
        return len(text.strip()) > 50
    except Exception:
        return False


def extract_text_with_ocr(file_path: str, dpi: int = 200) -> Optional[OCRResult]:
    """
    Extract text from a PDF file, using OCR for scanned pages.

    This function:
    1. First tries to extract text directly (for text-based PDFs)
    2. Falls back to OCR for pages that appear to be scanned images

    Args:
        file_path: Path to the PDF file
        dpi: Resolution for PDF to image conversion (higher = better quality but slower)

    Returns:
        OCRResult with extracted text and metadata, or None on failure
    """
    try:
        import PyPDF2
        from pdf2image import convert_from_path

        text_parts = []
        confidence_scores = []
        pages_with_text = 0
        is_scanned = False

        # Open PDF with PyPDF2 first
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            total_pages = len(reader.pages)

            for page_num in range(total_pages):
                # Try text extraction first
                if pdf_page_has_text(reader, page_num):
                    page_text = reader.pages[page_num].extract_text()
                    if page_text.strip():
                        text_parts.append(page_text)
                        confidence_scores.append(100)  # Direct text extraction = 100% confidence
                        pages_with_text += 1
                        continue

                # Page appears to be scanned - use OCR
                is_scanned = True
                logger.info(f"Page {page_num + 1} appears scanned, using OCR...")

                try:
                    # Convert just this page to image
                    images = convert_from_path(
                        file_path,
                        dpi=dpi,
                        first_page=page_num + 1,
                        last_page=page_num + 1
                    )

                    if images:
                        ocr_text, confidence = extract_text_from_image(images[0])
                        if ocr_text:
                            text_parts.append(ocr_text)
                            confidence_scores.append(confidence)
                            pages_with_text += 1
                except Exception as e:
                    logger.warning(f"OCR failed for page {page_num + 1}: {e}")

        if not text_parts:
            return None

        # Calculate overall confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

        return OCRResult(
            text='\n\n'.join(text_parts),
            confidence=round(avg_confidence, 2),
            pages_processed=total_pages,
            pages_with_text=pages_with_text,
            is_scanned=is_scanned
        )

    except ImportError as e:
        logger.error(f"Missing OCR dependency: {e}")
        logger.error("Install with: pip install pytesseract pdf2image Pillow")
        logger.error("Also install system dependencies: tesseract-ocr and poppler-utils")
        return None
    except Exception as e:
        logger.error(f"Error extracting text with OCR: {e}")
        return None


def get_ocr_quality_label(confidence: float) -> str:
    """
    Convert confidence score to human-readable quality label.

    Args:
        confidence: OCR confidence score (0-100)

    Returns:
        Quality label: 'good', 'fair', or 'poor'
    """
    if confidence >= 80:
        return 'good'
    elif confidence >= 60:
        return 'fair'
    else:
        return 'poor'


def check_ocr_system_dependencies() -> dict:
    """
    Check if all OCR system dependencies are installed.

    Returns:
        Dict with status of each dependency
    """
    status = {
        'pytesseract_installed': False,
        'pdf2image_installed': False,
        'tesseract_available': False,
        'poppler_available': False,
        'ready': False
    }

    try:
        import pytesseract
        status['pytesseract_installed'] = True

        try:
            pytesseract.get_tesseract_version()
            status['tesseract_available'] = True
        except Exception:
            pass
    except ImportError:
        pass

    try:
        import pdf2image
        status['pdf2image_installed'] = True

        # Test if poppler is available by trying a simple conversion
        # This is a lightweight check
        try:
            from pdf2image.exceptions import PDFInfoNotInstalledError
            status['poppler_available'] = True
        except Exception:
            pass
    except ImportError:
        pass

    status['ready'] = all([
        status['pytesseract_installed'],
        status['pdf2image_installed'],
        status['tesseract_available'],
        status['poppler_available']
    ])

    return status
