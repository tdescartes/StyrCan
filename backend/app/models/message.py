"""Messaging/communication model."""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from ..database import Base


class Message(Base):
    """Message model for employee communication."""
    
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    message_type = Column(String(20), default="direct")  # direct, broadcast
    subject = Column(String(255))
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    sent_at = Column(DateTime, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
    company = relationship("Company", back_populates="messages")
