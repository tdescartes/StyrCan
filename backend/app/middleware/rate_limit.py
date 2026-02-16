"""Rate limiting middleware using SlowAPI."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


# Create limiter instance
limiter = Limiter(key_func=get_remote_address)


def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Custom handler for rate limit exceeded errors."""
    logger.warning(
        f"Rate limit exceeded for {request.client.host} on {request.url.path}"
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.detail.split("Retry after ")[1] if "Retry after" in exc.detail else "60 seconds"
        }
    )


# Rate limit configurations for different endpoints
# These can be applied as decorators on endpoints

# Authentication endpoints - prevent brute force attacks
AUTH_RATE_LIMIT = "5/minute"  # 5 attempts per minute

# General API endpoints - prevent abuse
API_RATE_LIMIT = "100/minute"  # 100 requests per minute

# Heavy operations - prevent resource exhaustion
HEAVY_OPERATION_LIMIT = "10/minute"  # 10 per minute

# Public endpoints - more restrictive
PUBLIC_RATE_LIMIT = "20/minute"  # 20 requests per minute
