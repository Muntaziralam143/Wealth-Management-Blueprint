from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from datetime import datetime
from ..core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    type = Column(String(20), nullable=False)   # income/expense
    category = Column(String(80), nullable=True)
    amount = Column(Float, nullable=False)
    note = Column(String(255), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
