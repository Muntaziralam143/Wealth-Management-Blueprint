from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionIn(BaseModel):
    type: str
    category: Optional[str] = None
    amount: float
    note: Optional[str] = None
    date: Optional[datetime] = None

class TransactionOut(BaseModel):
    id: int
    type: str
    category: Optional[str]
    amount: float
    note: Optional[str]
    date: datetime

    class Config:
        from_attributes = True
