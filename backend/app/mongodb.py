"""MongoDB connection and initialization."""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional
import logging

from .config import settings

logger = logging.getLogger(__name__)

# MongoDB client
mongodb_client: Optional[AsyncIOMotorClient] = None


async def connect_mongodb():
    """Initialize MongoDB connection and Beanie ODM."""
    global mongodb_client
    
    try:
        logger.info(f"Connecting to MongoDB: {settings.mongodb_url}")
        mongodb_client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        
        # Ping the database to verify connection
        await mongodb_client.admin.command('ping')
        logger.info("MongoDB connection established successfully")
        
        # Initialize Beanie with document models
        from .mongo_models import (
            AuditLog,
            ChatMessage,
            Notification,
            AnalyticsEvent,
            DocumentMetadata,
            ApplicationLog
        )
        
        await init_beanie(
            database=mongodb_client[settings.mongodb_db],
            document_models=[
                AuditLog,
                ChatMessage,
                Notification,
                AnalyticsEvent,
                DocumentMetadata,
                ApplicationLog
            ]
        )
        logger.info("Beanie ODM initialized successfully")
        
    except Exception as e:
        logger.warning(f"MongoDB unavailable (non-fatal): {str(e)}")
        logger.warning("Audit logs, notifications, and chat features will be disabled until MongoDB is available")
        mongodb_client = None


async def close_mongodb():
    """Close MongoDB connection."""
    global mongodb_client
    
    if mongodb_client:
        mongodb_client.close()
        logger.info("MongoDB connection closed")


def get_mongodb_client() -> Optional[AsyncIOMotorClient]:
    """Get MongoDB client instance. Returns None if MongoDB is unavailable."""
    return mongodb_client
