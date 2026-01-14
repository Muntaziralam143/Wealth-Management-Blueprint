# app/utils/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

DEV_ADMIN_TOKEN = "admin-token"


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # ✅ DEV admin token support (your AdminLogin stores this)
    if token == DEV_ADMIN_TOKEN:
        dummy = User()  # ok even if not in DB
        # Force-set attributes (works even if model doesn't define them)
        setattr(dummy, "id", 0)
        setattr(dummy, "email", "admin@local")
        setattr(dummy, "name", "Dev Admin")
        setattr(dummy, "role", "admin")  # ✅ IMPORTANT
        return dummy

    # ✅ Normal JWT flow
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise credentials_exception

    return user


def require_admin(current_user=Depends(get_current_user)):
    role = getattr(current_user, "role", None)

    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
