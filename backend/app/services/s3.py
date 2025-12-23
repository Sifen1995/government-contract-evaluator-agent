"""
S3 Service for Document Storage

Provides secure file upload and download functionality using AWS S3
with pre-signed URLs for direct browser uploads.

Reference: TICKET-001 from IMPLEMENTATION_TICKETS.md
"""
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import hashlib
import logging
from typing import Optional
from datetime import datetime
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """
    S3 Service for managing document storage.

    Supports:
    - Pre-signed URLs for secure direct browser uploads
    - Pre-signed URLs for secure downloads
    - File deletion
    - File existence checking
    """

    ALLOWED_FILE_TYPES = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
    }

    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

    def __init__(self):
        """Initialize S3 client with configuration."""
        self._client = None
        self._bucket = settings.S3_BUCKET_NAME
        self._region = settings.AWS_REGION
        self._expiry = settings.S3_PRESIGNED_URL_EXPIRY

    @property
    def client(self):
        """Lazy initialization of S3 client."""
        if self._client is None:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self._client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self._region,
                    config=Config(signature_version='s3v4')
                )
            else:
                # Use default credentials (IAM role, environment, etc.)
                self._client = boto3.client(
                    's3',
                    region_name=self._region,
                    config=Config(signature_version='s3v4')
                )
        return self._client

    def validate_file_type(self, content_type: str, file_name: str) -> bool:
        """
        Validate that the file type is allowed.

        Args:
            content_type: MIME type of the file
            file_name: Name of the file

        Returns:
            True if file type is allowed, False otherwise
        """
        # Check MIME type
        if content_type not in self.ALLOWED_FILE_TYPES:
            return False

        # Check extension
        extension = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else ''
        return extension in self.ALLOWED_EXTENSIONS

    def validate_file_size(self, file_size: int) -> bool:
        """
        Validate that the file size is within limits.

        Args:
            file_size: Size of file in bytes

        Returns:
            True if size is valid, False otherwise
        """
        return 0 < file_size <= self.MAX_FILE_SIZE

    def generate_s3_key(self, company_id: str, document_type: str, file_name: str) -> str:
        """
        Generate a unique S3 key for storing the document.

        Format: companies/{company_id}/{document_type}/{timestamp}_{uuid}_{filename}

        Args:
            company_id: UUID of the company
            document_type: Type of document (capability_statement, certification, etc.)
            file_name: Original file name

        Returns:
            S3 key string
        """
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = "".join(c for c in file_name if c.isalnum() or c in '._-').lower()

        return f"companies/{company_id}/{document_type}/{timestamp}_{unique_id}_{safe_filename}"

    def generate_presigned_upload_url(
        self,
        s3_key: str,
        content_type: str,
        file_size: int,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Generate a pre-signed URL for uploading a file directly to S3.

        Args:
            s3_key: The S3 key where the file will be stored
            content_type: MIME type of the file
            file_size: Expected size of file in bytes
            metadata: Optional metadata to store with the file

        Returns:
            Dict with 'url' and 'fields' for the upload form

        Raises:
            ValueError: If file type or size is invalid
            ClientError: If S3 operation fails
        """
        if content_type not in self.ALLOWED_FILE_TYPES:
            raise ValueError(f"File type not allowed: {content_type}")

        if not self.validate_file_size(file_size):
            raise ValueError(f"File size must be between 0 and {self.MAX_FILE_SIZE} bytes")

        try:
            # Build conditions for the presigned POST
            conditions = [
                {"Content-Type": content_type},
                ["content-length-range", 1, self.MAX_FILE_SIZE],
            ]

            # Add metadata if provided
            fields = {"Content-Type": content_type}
            if metadata:
                for key, value in metadata.items():
                    meta_key = f"x-amz-meta-{key}"
                    fields[meta_key] = value
                    conditions.append({meta_key: value})

            # Generate presigned POST
            presigned = self.client.generate_presigned_post(
                Bucket=self._bucket,
                Key=s3_key,
                Fields=fields,
                Conditions=conditions,
                ExpiresIn=self._expiry
            )

            logger.info(f"Generated presigned upload URL for key: {s3_key}")
            return presigned

        except ClientError as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise

    def generate_presigned_download_url(self, s3_key: str, file_name: Optional[str] = None) -> str:
        """
        Generate a pre-signed URL for downloading a file from S3.

        Args:
            s3_key: The S3 key of the file
            file_name: Optional filename to use in Content-Disposition header

        Returns:
            Pre-signed URL string

        Raises:
            ClientError: If S3 operation fails
        """
        try:
            params = {
                'Bucket': self._bucket,
                'Key': s3_key,
            }

            # Add Content-Disposition for proper download filename
            if file_name:
                params['ResponseContentDisposition'] = f'attachment; filename="{file_name}"'

            url = self.client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=self._expiry
            )

            logger.info(f"Generated presigned download URL for key: {s3_key}")
            return url

        except ClientError as e:
            logger.error(f"Failed to generate presigned download URL: {e}")
            raise

    def delete_file(self, s3_key: str) -> bool:
        """
        Delete a file from S3.

        Args:
            s3_key: The S3 key of the file to delete

        Returns:
            True if deletion was successful

        Raises:
            ClientError: If S3 operation fails
        """
        try:
            self.client.delete_object(Bucket=self._bucket, Key=s3_key)
            logger.info(f"Deleted file from S3: {s3_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            raise

    def file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3.

        Args:
            s3_key: The S3 key to check

        Returns:
            True if file exists, False otherwise
        """
        try:
            self.client.head_object(Bucket=self._bucket, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise

    def get_file_metadata(self, s3_key: str) -> Optional[dict]:
        """
        Get metadata for a file in S3.

        Args:
            s3_key: The S3 key of the file

        Returns:
            Dict with file metadata or None if not found
        """
        try:
            response = self.client.head_object(Bucket=self._bucket, Key=s3_key)
            return {
                'content_type': response.get('ContentType'),
                'content_length': response.get('ContentLength'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {}),
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return None
            raise

    def calculate_checksum(self, file_content: bytes) -> str:
        """
        Calculate SHA-256 checksum of file content.

        Args:
            file_content: File content as bytes

        Returns:
            Hex string of SHA-256 hash
        """
        return hashlib.sha256(file_content).hexdigest()


# Global service instance
s3_service = S3Service()
