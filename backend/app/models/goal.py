from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey
from datetime import datetime
from ..core.database import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(120), nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, default=0.0)
    deadline = Column(DateTime, nullable=True)

    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
