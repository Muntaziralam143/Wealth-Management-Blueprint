from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GoalIn(BaseModel):
    title: str
    target_amount: float
    saved_amount: float = 0.0
    deadline: Optional[datetime] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    saved_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    is_completed: Optional[bool] = None

class GoalOut(BaseModel):
    id: int
    title: str
    target_amount: float
    saved_amount: float
    deadline: Optional[datetime]
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ✅ Admin router expects these names:
class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    target_amount: float = Field(gt=0)
    saved_amount: float = Field(default=0, ge=0)


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    target_amount: Optional[float] = Field(default=None, gt=0)
    saved_amount: Optional[float] = Field(default=None, ge=0)
