from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.goal import Goal
from ..schemas.goal_schema import GoalIn, GoalOut, GoalUpdate
from .user_router import current_user
from ..models.user import User

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.post("", response_model=GoalOut)
def create_goal(payload: GoalIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    goal = Goal(user_id=user.id, **payload.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.get("", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.created_at.desc()).all()

@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)

    if goal.saved_amount >= goal.target_amount:
        goal.is_completed = True

    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"ok": True}
