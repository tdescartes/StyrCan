"""File upload and management router."""

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from ..auth import get_current_user
from ..models import User
from ..utils.s3_storage import s3_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Allowed file types
ALLOWED_EXTENSIONS = {
    "documents": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"],
    "images": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    "all": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".csv"]
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file(file: UploadFile, allowed_types: List[str]) -> None:
    """Validate file type and size."""
    # Check file extension
    file_ext = "." + file.filename.split(".")[-1].lower()
    if file_ext not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_types)}"
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Query("documents", description="Folder to store file in"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a file to S3 storage.
    
    Folder options: 'invoices', 'employee-docs', 'reports', 'documents'
    """
    try:
        # Validate file type
        validate_file(file, ALLOWED_EXTENSIONS["all"])
        
        # Add company context to folder path for multi-tenancy
        company_folder = f"{current_user.company_id}/{folder}"
        
        # Upload to S3
        result = await s3_service.upload_file(file, folder=company_folder)
        
        logger.info(f"File uploaded by user {current_user.id}: {result['file_key']}")
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file": result
        }
        
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )


@router.post("/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    folder: str = Query("documents", description="Folder to store files in"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload multiple files to S3 storage.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files can be uploaded at once"
        )
    
    uploaded_files = []
    errors = []
    
    for file in files:
        try:
            validate_file(file, ALLOWED_EXTENSIONS["all"])
            company_folder = f"{current_user.company_id}/{folder}"
            result = await s3_service.upload_file(file, folder=company_folder)
            uploaded_files.append(result)
        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "success": len(errors) == 0,
        "message": f"Uploaded {len(uploaded_files)}/{len(files)} files successfully",
        "uploaded_files": uploaded_files,
        "errors": errors
    }


@router.get("/list")
async def list_files(
    folder: str = Query("", description="Folder to list files from"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List files in a specific folder.
    """
    try:
        # Add company context to folder path
        company_folder = f"{current_user.company_id}/{folder}" if folder else current_user.company_id
        
        files = s3_service.list_files(prefix=company_folder, max_keys=100)
        
        return {
            "success": True,
            "folder": folder,
            "files": files,
            "count": len(files)
        }
        
    except Exception as e:
        logger.error(f"Failed to list files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list files: {str(e)}"
        )


@router.get("/download/{file_key:path}")
async def get_file_url(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a presigned URL for downloading a file.
    
    The URL expires after 1 hour.
    """
    try:
        # Verify file belongs to user's company
        if not file_key.startswith(current_user.company_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this file"
            )
        
        # Generate presigned URL
        url = s3_service.get_presigned_url(file_key, expiration=3600)
        
        return {
            "success": True,
            "file_key": file_key,
            "download_url": url,
            "expires_in": 3600
        }
        
    except Exception as e:
        logger.error(f"Failed to generate download URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.delete("/delete/{file_key:path}")
async def delete_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a file from S3 storage.
    """
    try:
        # Verify file belongs to user's company
        if not file_key.startswith(current_user.company_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this file"
            )
        
        # Only admins can delete files
        if current_user.role not in ["company_admin", "super_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can delete files"
            )
        
        # Delete file
        success = s3_service.delete_file(file_key)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete file"
            )
        
        logger.info(f"File deleted by user {current_user.id}: {file_key}")
        
        return {
            "success": True,
            "message": "File deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )


@router.get("/metadata/{file_key:path}")
async def get_file_metadata(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get metadata for a file.
    """
    try:
        # Verify file belongs to user's company
        if not file_key.startswith(current_user.company_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this file"
            )
        
        metadata = s3_service.get_file_metadata(file_key)
        
        if not metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return {
            "success": True,
            "file_key": file_key,
            "metadata": metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get file metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get file metadata: {str(e)}"
        )
