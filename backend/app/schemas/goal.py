from pydantic import BaseModel
from typing import Optional

class GoalCreate(BaseModel):
    title: str
    target_amount: float
    saved_amount: float = 0

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
