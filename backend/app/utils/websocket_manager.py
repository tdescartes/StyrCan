"""WebSocket manager for real-time notifications."""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications."""
    
    def __init__(self):
        # Dictionary mapping company_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Dictionary mapping websocket to user info for logging
        self.connection_info: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, company_id: int, user_id: int, user_email: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        # Add to company's connection pool
        if company_id not in self.active_connections:
            self.active_connections[company_id] = set()
        self.active_connections[company_id].add(websocket)
        
        # Store connection info
        self.connection_info[websocket] = {
            "company_id": company_id,
            "user_id": user_id,
            "user_email": user_email,
            "connected_at": datetime.utcnow()
        }
        
        logger.info(f"WebSocket connected: user={user_email}, company={company_id}")
        
        # Send welcome message
        await self.send_personal_message(
            websocket,
            {
                "type": "connection",
                "status": "connected",
                "message": "WebSocket connection established",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.connection_info:
            info = self.connection_info[websocket]
            company_id = info["company_id"]
            user_email = info["user_email"]
            
            # Remove from company's connection pool
            if company_id in self.active_connections:
                self.active_connections[company_id].discard(websocket)
                
                # Clean up empty company pools
                if not self.active_connections[company_id]:
                    del self.active_connections[company_id]
            
            # Remove connection info
            del self.connection_info[websocket]
            
            logger.info(f"WebSocket disconnected: user={user_email}, company={company_id}")
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send a message to a specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast_to_company(
        self,
        company_id: int,
        message: dict,
        exclude_websocket: Optional[WebSocket] = None
    ):
        """Broadcast a message to all connections in a company."""
        if company_id not in self.active_connections:
            return
        
        # Get all connections for this company
        connections = self.active_connections[company_id].copy()
        
        # Send to all connections (except excluded one)
        disconnected = []
        for connection in connections:
            if connection == exclude_websocket:
                continue
            
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected websockets
        for connection in disconnected:
            self.disconnect(connection)
    
    async def notify_user(self, user_id: int, company_id: int, message: dict):
        """Send a notification to a specific user."""
        if company_id not in self.active_connections:
            return
        
        # Find all connections for this user
        for websocket, info in self.connection_info.items():
            if info["user_id"] == user_id and info["company_id"] == company_id:
                await self.send_personal_message(websocket, message)
    
    def get_active_connections_count(self, company_id: Optional[int] = None) -> int:
        """Get the number of active connections."""
        if company_id:
            return len(self.active_connections.get(company_id, set()))
        return sum(len(connections) for connections in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()


# Notification helper functions
async def notify_company(
    company_id: int,
    notification_type: str,
    title: str,
    message: str,
    data: Optional[dict] = None
):
    """Send a notification to all users in a company."""
    notification = {
        "type": "notification",
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast_to_company(company_id, notification)


async def notify_user_specific(
    user_id: int,
    company_id: int,
    notification_type: str,
    title: str,
    message: str,
    data: Optional[dict] = None
):
    """Send a notification to a specific user."""
    notification = {
        "type": "notification",
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.notify_user(user_id, company_id, notification)
