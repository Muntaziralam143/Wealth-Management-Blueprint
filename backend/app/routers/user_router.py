from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.jwt import get_current_user  # ✅ uses HTTPBearer now
from ..models.user import User
from ..schemas.user_schema import UserOut

router = APIRouter(prefix="/users", tags=["Users"])


def current_user(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),  # ✅ payload from JWT
) -> User:
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user
