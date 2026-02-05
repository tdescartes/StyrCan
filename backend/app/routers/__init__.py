"""API routers package."""

from .auth import router as auth_router
from .messaging import router as messaging_router
from .notifications import router as notifications_router
from .employees import router as employees_router
from .finances import router as finances_router
from .payroll import router as payroll_router
from .dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "messaging_router",
    "notifications_router",
    "employees_router",
    "finances_router",
    "payroll_router",
    "dashboard_router",
]
