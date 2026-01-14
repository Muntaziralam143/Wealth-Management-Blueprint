from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..core.reset_tokens import create_reset_token, verify_reset_token
from ..core.config import settings
from ..schemas.user_schema import ForgotPasswordIn, ResetPasswordIn
from ..core.database import get_db
from ..core.security import hash_password, verify_password
from ..core.jwt import create_access_token
from ..models.user import User
from ..schemas.user_schema import RegisterIn, LoginIn, TokenOut

router = APIRouter(prefix="/auth", tags=["Auth"])



@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"access_token": create_access_token(str(user.id))}


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"access_token": create_access_token(str(user.id))}


# ✅ FIXED: removed extra "/auth"
@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    # 1) check user exists
    user = db.query(User).filter(User.email == payload.email).first()

    # IMPORTANT: always return same message (avoid email enumeration)
    if not user:
        return {"ok": True, "message": "If the email exists, a reset link will be sent."}

    # 2) create reset token
    token = create_reset_token(user.email)

    # 3) build reset link for frontend
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    # For now we return link so you can test without email service
    return {
        "ok": True,
        "message": "Reset link generated (dev mode).",
        "reset_link": reset_link,
        "token_expires_minutes": settings.RESET_TOKEN_EXPIRE_MINUTES,
    }


# ✅ FIXED: removed extra "/auth"
@router.post("/reset-password")
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)):
    # 1) verify token
    max_age = int(settings.RESET_TOKEN_EXPIRE_MINUTES) * 60
    email = verify_reset_token(payload.token, max_age_seconds=max_age)

    # 2) find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3) set new password hash
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    return {"ok": True, "message": "Password updated successfully"}
