"""Tenant context middleware for multi-tenancy isolation."""

from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt

from ..config import settings


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract and inject company context into requests.
    
    This provides a security layer for multi-tenancy by:
    1. Extracting company_id from validated JWT tokens
    2. Injecting it into request.state for easy access
    3. Logging suspicious cross-company access patterns
    
    Note: This middleware runs BEFORE authentication, so it only extracts
    the company_id without validating the user. Full validation happens
    in get_current_user dependency.
    """
    
    def __init__(self, app, enable_logging: bool = True):
        super().__init__(app)
        self.enable_logging = enable_logging
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and inject tenant context."""
        
        # Skip for public endpoints
        public_paths = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/refresh",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health"
        ]
        
        if any(request.url.path.startswith(path) for path in public_paths):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
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
                
                # Extract company_id from token
                company_id = payload.get("company_id")
                user_id = payload.get("sub")
                user_role = payload.get("role")
                
                if company_id:
                    # Inject into request state
                    request.state.company_id = company_id
                    request.state.user_id = user_id
                    request.state.user_role = user_role
                    
                    # Also check for X-Company-ID header (frontend redundant check)
                    header_company_id = request.headers.get("X-Company-ID")
                    if header_company_id and header_company_id != company_id:
                        # Potential security issue: header doesn't match token
                        if self.enable_logging:
                            print(f"⚠️  Company ID mismatch: Token={company_id}, Header={header_company_id}, User={user_id}")
                        
                        return JSONResponse(
                            status_code=status.HTTP_403_FORBIDDEN,
                            content={"detail": "Company context mismatch"}
                        )
                
            except JWTError as e:
                # Token is invalid, but we don't return error here
                # Let the authentication dependency handle it
                if self.enable_logging:
                    print(f"⚠️  JWT decode error in tenant middleware: {str(e)}")
                pass
        
        # Continue processing request
        response = await call_next(request)
        return response


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
