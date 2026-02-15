"""Tenant context middleware for multi-tenancy isolation."""

from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
import logging
from datetime import datetime

from ..config import settings

logger = logging.getLogger(__name__)


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract and inject company context into requests.
    
    This provides a CRITICAL security layer for multi-tenancy by:
    1. Extracting company_id from validated JWT tokens
    2. Injecting it into request.state for easy access by downstream handlers
    3. Validating X-Company-ID header matches token (prevents token reuse attacks)
    4. Logging suspicious cross-company access patterns
    5. Blocking requests with company context mismatches
    
    Note: This middleware runs BEFORE authentication, so it only extracts
    the company_id without validating the user. Full validation happens
    in get_current_user dependency.
    """
    
    def __init__(self, app, enable_logging: bool = True):
        super().__init__(app)
        self.enable_logging = enable_logging
        self.suspicious_attempts = []  # Track suspicious patterns
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and inject tenant context with security validation."""
        
        # List of public endpoints that don't require company context
        public_paths = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/"
        ]
        
        # Check if this is a public endpoint
        is_public = any(request.url.path.startswith(path) for path in public_paths)
        
        if is_public:
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        company_id = None
        user_id = None
        user_role = None
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            
            try:
                # Decode token (without full validation - that happens in get_current_user)
                payload = jwt.decode(
                    token,
                    settings.secret_key,
                    algorithms=[settings.algorithm],
                    options={"verify_exp": False}  # Don't check expiry here
                )
                
                # Extract company context from token
                company_id = payload.get("company_id")
                user_id = payload.get("sub")
                user_role = payload.get("role")
                
                if company_id:
                    # Inject into request state for downstream use
                    request.state.company_id = company_id
                    request.state.user_id = user_id
                    request.state.user_role = user_role
                    
                    # CRITICAL SECURITY CHECK: Validate X-Company-ID header matches token
                    # This prevents stolen tokens from being used in different company contexts
                    header_company_id = request.headers.get("X-Company-ID")
                    
                    if header_company_id and header_company_id != company_id:
                        # SECURITY ALERT: Company ID mismatch detected
                        logger.warning(
                            f"🚨 SECURITY: Company ID mismatch detected | "
                            f"User: {user_id} | "
                            f"Token Company: {company_id} | "
                            f"Header Company: {header_company_id} | "
                            f"Path: {request.url.path} | "
                            f"Method: {request.method} | "
                            f"IP: {request.client.host if request.client else 'unknown'} | "
                            f"User-Agent: {request.headers.get('user-agent', 'unknown')}"
                        )
                        
                        # Log to audit trail (async, don't block request)
                        try:
                            await self._log_security_event(
                                user_id=user_id,
                                token_company_id=company_id,
                                header_company_id=header_company_id,
                                request=request
                            )
                        except Exception as e:
                            logger.error(f"Failed to log security event: {str(e)}")
                        
                        # Block the request
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={
                                "detail": "Company context mismatch. This incident has been logged.",
                                "error_code": "COMPANY_MISMATCH"
                            }
                        )
                    
                    # Optional: Log successful company context injection (debug mode only)
                    if self.enable_logging and settings.debug:
                        logger.debug(
                            f"✓ Company context injected | "
                            f"User: {user_id} | "
                            f"Company: {company_id} | "
                            f"Path: {request.url.path}"
                        )
                
            except JWTError as e:
                # Token is invalid, but we don't return error here
                # Let the authentication dependency handle it
                if self.enable_logging:
                    logger.debug(f"JWT decode error in tenant middleware: {str(e)}")
                pass
        else:
            # No Authorization header for protected endpoint
            # Let auth dependency handle this
            if self.enable_logging and settings.debug:
                logger.debug(f"No auth header for protected endpoint: {request.url.path}")
        
        # Continue processing request
        response = await call_next(request)
        
        # Add company context to response headers (useful for debugging)
        if company_id and settings.debug:
            response.headers["X-Company-Context"] = company_id
        
        return response
    
    async def _log_security_event(
        self,
        user_id: str,
        token_company_id: str,
        header_company_id: str,
        request: Request
    ):
        """
        Log suspicious security events to MongoDB audit trail.
        
        This creates a permanent record of potential security incidents.
        """
        from ..mongo_models import AuditLog, AuditAction
        
        audit = AuditLog(
            user_id=user_id,
            company_id=token_company_id,
            action=AuditAction.READ,
            resource_type="security_event",
            resource_id="company_mismatch",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            details={
                "event_type": "company_context_mismatch",
                "token_company_id": token_company_id,
                "header_company_id": header_company_id,
                "path": str(request.url.path),
                "method": request.method,
                "timestamp": datetime.utcnow().isoformat()
            },
            success=False,
            error_message="Company ID header does not match JWT token"
        )
        
        try:
            await audit.insert()
        except Exception as e:
            # Don't fail the main request if audit logging fails
            logger.error(f"Failed to insert audit log: {str(e)}")


def get_tenant_context(request: Request) -> str:
    """
    Helper to get company_id from request state.
    
    Usage:
        company_id = get_tenant_context(request)
    
    Returns:
        Company ID string or None if not found
    """
    return getattr(request.state, "company_id", None)


def verify_company_access(request: Request, resource_company_id: str) -> bool:
    """
    Verify that the current user's company matches the resource's company.
    
    Args:
        request: FastAPI request object
        resource_company_id: Company ID of the resource being accessed
    
    Returns:
        True if access is allowed, False otherwise
    
    Usage:
        if not verify_company_access(request, employee.company_id):
            raise HTTPException(status_code=403, detail="Access denied")
    """
    tenant_company_id = get_tenant_context(request)
    
    if not tenant_company_id:
        # No company context in request (shouldn't happen with middleware)
        return False
    
    return tenant_company_id == resource_company_id
