from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import create_access_token
from ..schemas.user import (
    UserCreate, User, UserLogin, TokenResponse,
    PasswordResetRequest, PasswordReset, EmailVerify
)
from ..services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    user = auth_service.create_user(db, user_data)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """Logout user (client-side token invalidation)"""
    # In a stateless JWT system, logout is handled client-side
    # For production, consider using a token blacklist in Redis
    return None


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Send password reset email"""
    # Generate reset token
    token = auth_service.generate_password_reset_token()

    # In production, send email with reset link
    # For MVP, we'll return a simplified message

    return {
        "message": "Password reset email sent",
        "token": token  # Remove this in production
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Reset password with token"""
    user = auth_service.reset_password(db, reset_data.token, reset_data.new_password)

    return {"message": "Password reset successful"}


@router.get("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email with token"""
    user = auth_service.verify_email_token(db, token)

    return {"message": "Email verified successfully", "user": user}
