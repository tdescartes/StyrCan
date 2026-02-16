"""WebSocket router for real-time notifications."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session
import logging
from typing import Optional

from ..auth.security import decode_token
from ..database import get_db
from ..models.user import User
from ..utils.websocket_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """Extract user from JWT token."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except Exception as e:
        logger.error(f"Failed to decode token: {e}")
        return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    """
    WebSocket endpoint for real-time notifications.
    
    Connect using: ws://localhost:8000/api/notifications/ws?token=YOUR_JWT_TOKEN
    """
    # Get database session
    db = next(get_db())
    
    try:
        # Authenticate user from token
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WebSocket connection rejected: No token provided")
            return
        
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning("WebSocket connection rejected: Invalid token")
            return
        
        if not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            logger.warning(f"WebSocket connection rejected: Inactive user {user.email}")
            return
        
        # Connect the websocket
        await manager.connect(
            websocket=websocket,
            company_id=user.company_id,
            user_id=user.id,
            user_email=user.email
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive and process messages from client
                data = await websocket.receive_json()
                
                # Handle different message types
                message_type = data.get("type")
                
                if message_type == "ping":
                    # Respond to ping with pong
                    await manager.send_personal_message(
                        websocket,
                        {"type": "pong", "timestamp": data.get("timestamp")}
                    )
                
                elif message_type == "broadcast":
                    # Broadcast message to all company users (admin only)
                    if user.role in ["admin", "manager"]:
                        await manager.broadcast_to_company(
                            company_id=user.company_id,
                            message={
                                "type": "message",
                                "from": user.email,
                                "content": data.get("content"),
                                "timestamp": data.get("timestamp")
                            },
                            exclude_websocket=websocket  # Don't send back to sender
                        )
                
                else:
                    logger.warning(f"Unknown message type: {message_type}")
            
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                break
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        # Disconnect and cleanup
        manager.disconnect(websocket)
        db.close()


@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics (admin only)."""
    return {
        "total_connections": manager.get_active_connections_count(),
        "companies_connected": len(manager.active_connections)
    }
