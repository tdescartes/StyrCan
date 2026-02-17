"""AWS S3 file storage service."""

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from typing import Optional, Dict
import uuid
import logging
from pathlib import Path

from ..config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for managing file uploads to AWS S3."""
    
    def __init__(self):
        """Initialize S3 client."""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name = settings.aws_s3_bucket_name
    
    async def upload_file(
        self,
        file: UploadFile,
        folder: str = "",
        filename: Optional[str] = None
    ) -> Dict[str, str]:
        """Upload a file to S3.
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder path within bucket (e.g., "invoices", "employee-docs")
            filename: Custom filename (optional, generates UUID if not provided)
            
        Returns:
            Dictionary with file_key, file_url, and original_filename
        """
        try:
            # Generate unique filename if not provided
            if not filename:
                file_extension = Path(file.filename).suffix
                filename = f"{uuid.uuid4()}{file_extension}"
            
            # Construct S3 key (path)
            file_key = f"{folder}/{filename}" if folder else filename
            
            # Read file content
            file_content = await file.read()
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=file.content_type or 'application/octet-stream',
                Metadata={
                    'original_filename': file.filename
                }
            )
            
            # Generate public URL
            file_url = f"https://{self.bucket_name}.s3.{settings.aws_region}.amazonaws.com/{file_key}"
            
            logger.info(f"File uploaded successfully: {file_key}")
            
            return {
                "file_key": file_key,
                "file_url": file_url,
                "original_filename": file.filename
            }
            
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise Exception(f"File upload failed: {str(e)}")
    
    def get_presigned_url(
        self,
        file_key: str,
        expiration: int = 3600
    ) -> str:
        """Generate a presigned URL for temporary file access.
        
        Args:
            file_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL string
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise Exception(f"URL generation failed: {str(e)}")
    
    def delete_file(self, file_key: str) -> bool:
        """Delete a file from S3.
        
        Args:
            file_key: S3 object key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            logger.info(f"File deleted successfully: {file_key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False
    
    def list_files(self, prefix: str = "", max_keys: int = 100) -> list:
        """List files in a folder (prefix).
        
        Args:
            prefix: Folder prefix to filter by
            max_keys: Maximum number of files to return
            
        Returns:
            List of file keys
        """
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            
            if 'Contents' not in response:
                return []
            
            return [obj['Key'] for obj in response['Contents']]
        except ClientError as e:
            logger.error(f"Failed to list files from S3: {e}")
            return []
    
    def get_file_metadata(self, file_key: str) -> Optional[Dict]:
        """Get metadata for a file.
        
        Args:
            file_key: S3 object key
            
        Returns:
            Dictionary with file metadata or None if not found
        """
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            
            return {
                "content_type": response.get('ContentType'),
                "content_length": response.get('ContentLength'),
                "last_modified": response.get('LastModified'),
                "metadata": response.get('Metadata', {})
            }
        except ClientError as e:
            logger.error(f"Failed to get file metadata: {e}")
            return None


# Singleton instance
s3_service = S3Service()
