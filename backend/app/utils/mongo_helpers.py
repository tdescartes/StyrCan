"""MongoDB query helpers for multi-tenancy."""

from typing import TypeVar, Type, List, Optional, Dict, Any
from beanie import Document
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING


T = TypeVar('T', bound=Document)


async def find_by_company(
    document_class: Type[T],
    company_id: str,
    filters: Optional[Dict[str, Any]] = None,
    sort: Optional[str] = None,
    skip: int = 0,
    limit: Optional[int] = None
) -> List[T]:
    """
    Find documents filtered by company_id.
    
    This helper ensures ALL MongoDB queries are scoped to a company.
    
    Usage:
        # Find all notifications for a company
        notifications = await find_by_company(
            Notification,
            company_id=user.company_id,
            filters={"is_read": False},
            sort="-created_at",
            limit=50
        )
    
    Args:
        document_class: Beanie document model class
        company_id: Company UUID to filter by
        filters: Additional filter criteria (e.g., {"status": "active"})
        sort: Sort field (prefix with '-' for descending, e.g., "-created_at")
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
    
    Returns:
        List of document instances
    """
    # Build query with company_id
    query_filters = {"company_id": company_id}
    
    # Add additional filters
    if filters:
        query_filters.update(filters)
    
    # Start query
    query = document_class.find(query_filters)
    
    # Apply sorting
    if sort:
        if sort.startswith('-'):
            # Descending sort
            query = query.sort((sort[1:], DESCENDING))
        else:
            # Ascending sort
            query = query.sort((sort, ASCENDING))
    
    # Apply pagination
    if skip > 0:
        query = query.skip(skip)
    
    if limit:
        query = query.limit(limit)
    
    # Execute query
    return await query.to_list()


async def find_one_by_company(
    document_class: Type[T],
    company_id: str,
    filters: Optional[Dict[str, Any]] = None
) -> Optional[T]:
    """
    Find a single document filtered by company_id.
    
    Usage:
        # Find a specific audit log
        audit_log = await find_one_by_company(
            AuditLog,
            company_id=user.company_id,
            filters={"user_id": user.id, "action": "login"}
        )
    
    Args:
        document_class: Beanie document model class
        company_id: Company UUID to filter by
        filters: Additional filter criteria
    
    Returns:
        Document instance or None if not found
    """
    query_filters = {"company_id": company_id}
    
    if filters:
        query_filters.update(filters)
    
    return await document_class.find_one(query_filters)


async def count_by_company(
    document_class: Type[T],
    company_id: str,
    filters: Optional[Dict[str, Any]] = None
) -> int:
    """
    Count documents filtered by company_id.
    
    Usage:
        # Count unread notifications
        unread_count = await count_by_company(
            Notification,
            company_id=user.company_id,
            filters={"is_read": False}
        )
    
    Args:
        document_class: Beanie document model class
        company_id: Company UUID to filter by
        filters: Additional filter criteria
    
    Returns:
        Number of matching documents
    """
    query_filters = {"company_id": company_id}
    
    if filters:
        query_filters.update(filters)
    
    return await document_class.find(query_filters).count()


async def create_with_company(
    document_class: Type[T],
    company_id: str,
    data: Dict[str, Any]
) -> T:
    """
    Create a new document with company_id automatically injected.
    
    Usage:
        # Create notification
        notification = await create_with_company(
            Notification,
            company_id=user.company_id,
            data={
                "user_id": user.id,
                "type": "info",
                "title": "Welcome",
                "message": "Your account is active"
            }
        )
    
    Args:
        document_class: Beanie document model class
        company_id: Company UUID to inject
        data: Document field values
    
    Returns:
        Created document instance
    """
    # Inject company_id
    data['company_id'] = company_id
    
    # Create and save document
    document = document_class(**data)
    await document.insert()
    
    return document


async def update_by_company(
    document_class: Type[T],
    document_id: str,
    company_id: str,
    updates: Dict[str, Any]
) -> Optional[T]:
    """
    Update a document ensuring it belongs to the specified company.
    
    Usage:
        # Mark notification as read
        updated = await update_by_company(
            Notification,
            document_id=notif_id,
            company_id=user.company_id,
            updates={"is_read": True, "read_at": datetime.utcnow()}
        )
    
    Args:
        document_class: Beanie document model class
        document_id: Document ID to update
        company_id: Company UUID (ownership verification)
        updates: Dictionary of fields to update
    
    Returns:
        Updated document instance or None if not found/unauthorized
    
    Raises:
        HTTPException 403: If document belongs to different company
    """
    # Fetch document
    document = await document_class.get(document_id)
    
    if not document:
        return None
    
    # Validate company ownership
    if document.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Document belongs to a different company"
        )
    
    # Apply updates
    for field, value in updates.items():
        setattr(document, field, value)
    
    # Save
    await document.save()
    
    return document


async def delete_by_company(
    document_class: Type[T],
    document_id: str,
    company_id: str
) -> bool:
    """
    Delete a document ensuring it belongs to the specified company.
    
    Usage:
        # Delete old notification
        deleted = await delete_by_company(
            Notification,
            document_id=notif_id,
            company_id=user.company_id
        )
    
    Args:
        document_class: Beanie document model class
        document_id: Document ID to delete
        company_id: Company UUID (ownership verification)
    
    Returns:
        True if deleted, False if not found
    
    Raises:
        HTTPException 403: If document belongs to different company
    """
    # Fetch document
    document = await document_class.get(document_id)
    
    if not document:
        return False
    
    # Validate company ownership
    if document.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Document belongs to a different company"
        )
    
    # Delete
    await document.delete()
    
    return True


def validate_company_access_mongo(document: Document, company_id: str) -> None:
    """
    Validate that a MongoDB document belongs to the specified company.
    
    Usage:
        notification = await Notification.get(notif_id)
        if not notification:
            raise HTTPException(404, "Notification not found")
        
        validate_company_access_mongo(notification, user.company_id)
    
    Args:
        document: Beanie document instance
        company_id: Expected company_id
    
    Raises:
        HTTPException 403: If document belongs to different company
        HTTPException 500: If document has no company_id
    """
    if not hasattr(document, 'company_id'):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document does not support multi-tenancy"
        )
    
    if document.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Document belongs to a different company"
        )


async def bulk_create_with_company(
    document_class: Type[T],
    company_id: str,
    data_list: List[Dict[str, Any]]
) -> List[T]:
    """
    Bulk create documents with company_id automatically injected.
    
    Usage:
        # Bulk create notifications
        notifications = await bulk_create_with_company(
            Notification,
            company_id=user.company_id,
            data_list=[
                {"user_id": user1_id, "title": "Welcome", "message": "..."},
                {"user_id": user2_id, "title": "Welcome", "message": "..."},
            ]
        )
    
    Args:
        document_class: Beanie document model class
        company_id: Company UUID to inject
        data_list: List of document field dictionaries
    
    Returns:
        List of created document instances
    """
    # Inject company_id into all documents
    for data in data_list:
        data['company_id'] = company_id
    
    # Create documents
    documents = [document_class(**data) for data in data_list]
    
    # Bulk insert
    await document_class.insert_many(documents)
    
    return documents
