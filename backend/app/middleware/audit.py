"""Audit logging middleware for tracking user actions."""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
from typing import Callable
import logging

from ..mongo_models import AuditLog, AuditAction
from ..auth.security import get_current_user
from ..mongodb import get_mongodb_client

logger = logging.getLogger(__name__)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically log API requests for audit purposes."""
    
    # Routes to exclude from audit logging
    EXCLUDED_PATHS = {
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico"
    }
    
    # Methods that don't modify data
    READ_METHODS = {"GET", "HEAD", "OPTIONS"}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log audit trail."""
        
        # Skip excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)
        
        # Skip static files
        if request.url.path.startswith("/static"):
            return await call_next(request)
        
        start_time = datetime.utcnow()
        
        # Extract user info if available
        user_id = None
        company_id = None
        try:
            # Try to get user from request state (set by auth dependency)
            if hasattr(request.state, "user"):
                user_id = request.state.user.get("id")
                company_id = request.state.user.get("company_id")
        except Exception:
            pass
        
        # Determine action type
        action = self._determine_action(request.method, request.url.path)
        
        # Process request
        response = await call_next(request)
        
        # Log audit trail for write operations or failed requests
        if request.method not in self.READ_METHODS or response.status_code >= 400:
            try:
                await self._log_audit(
                    request=request,
                    response=response,
                    user_id=user_id,
                    company_id=company_id,
                    action=action,
                    start_time=start_time
                )
            except Exception as e:
                logger.error(f"Failed to log audit trail: {str(e)}")
        
        return response
    
    def _determine_action(self, method: str, path: str) -> AuditAction:
        """Determine audit action from HTTP method."""
        if method == "POST":
            if "login" in path:
                return AuditAction.LOGIN
            return AuditAction.CREATE
        elif method == "PUT" or method == "PATCH":
            return AuditAction.UPDATE
        elif method == "DELETE":
            return AuditAction.DELETE
        else:
            return AuditAction.READ
    
    async def _log_audit(
        self,
        request: Request,
        response: Response,
        user_id: str,
        company_id: str,
        action: AuditAction,
        start_time: datetime
    ):
        """Create audit log entry."""
        
        # Extract resource type from path
        path_parts = request.url.path.strip("/").split("/")
        resource_type = path_parts[1] if len(path_parts) > 1 else "unknown"
        resource_id = path_parts[2] if len(path_parts) > 2 else None
        
        # Determine success
        success = 200 <= response.status_code < 400
        
        # Create audit log
        audit_log = AuditLog(
            user_id=user_id,
            company_id=company_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            details={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "status_code": response.status_code,
                "duration_ms": (datetime.utcnow() - start_time).total_seconds() * 1000
            },
            success=success,
            error_message=None if success else f"HTTP {response.status_code}",
            timestamp=start_time
        )
        
        await audit_log.insert()
        logger.debug(f"Audit log created: {action} on {resource_type} by user {user_id}")
