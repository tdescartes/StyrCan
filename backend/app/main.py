"""Main FastAPI application entry point."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from .config import settings
from .database import init_db, close_db
from .mongodb import connect_mongodb, close_mongodb
from .middleware.error_handler import add_error_handlers
from .middleware.logging import setup_logging
from .middleware.audit import AuditLogMiddleware

# Import routers
from .routers import (
    auth_router,
    messaging_router,
    notifications_router,
    employees_router,
    finances_router,
    payroll_router,
    dashboard_router,
    settings_router,
)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")
    init_db()
    logger.info("PostgreSQL database initialized")
    await connect_mongodb()
    logger.info("MongoDB initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    close_db()
    logger.info("PostgreSQL connections closed")
    await close_mongodb()
    logger.info("MongoDB connections closed")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Business management platform for small businesses",
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
    lifespan=lifespan
)


# CORS Middleware - Must be added before other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods if settings.cors_methods else ["*"],
    allow_headers=settings.cors_headers if settings.cors_headers else ["*"],
    expose_headers=["*"],
)

# Audit logging middleware
app.add_middleware(AuditLogMiddleware)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Add error handlers
add_error_handlers(app)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "docs": "/api/docs" if settings.debug else "Documentation disabled in production"
    }


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(messaging_router, prefix="/api/messages", tags=["Messaging"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(employees_router, prefix="/api/employees", tags=["Employees"])
app.include_router(finances_router, prefix="/api/finances", tags=["Finances"])
app.include_router(payroll_router, prefix="/api/payroll", tags=["Payroll"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
