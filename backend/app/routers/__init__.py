"""API routers package."""

from .auth import router as auth_router
from .messaging import router as messaging_router
from .notifications import router as notifications_router

__all__ = ["auth_router", "messaging_router", "notifications_router"]
