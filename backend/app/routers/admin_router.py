from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.utils.deps import require_admin
  # ✅ use ONLY this

from ..models.user import User
from ..models.goal import Goal

from ..schemas.user_schema import UserOut
from ..schemas.goal_schema import GoalCreate, GoalUpdate

router = APIRouter(tags=["Admin"])


@router.get("/admin/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),  # ✅ admin is validated here
):
    return db.query(User).order_by(User.id.desc()).all()


@router.get("/admin/users/{user_id}/goals")
def list_goals_for_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .order_by(Goal.id.desc())
        .all()
    )
    return goals


@router.post("/admin/users/{user_id}/goals")
def admin_create_goal_for_user(
    user_id: int,
    payload: GoalCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    goal = Goal(
        user_id=user_id,
        title=payload.title,
        target_amount=payload.target_amount,
        saved_amount=payload.saved_amount,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/admin/goals/{goal_id}")
def admin_update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.title is not None:
        goal.title = payload.title
    if payload.target_amount is not None:
        goal.target_amount = payload.target_amount
    if payload.saved_amount is not None:
        goal.saved_amount = payload.saved_amount

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/admin/goals/{goal_id}")
def admin_delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"ok": True}
