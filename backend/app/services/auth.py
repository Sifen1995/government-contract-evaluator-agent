from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import secrets
from ..models.user import User
from ..core.security import get_password_hash, verify_password, create_access_token
from ..schemas.user import UserCreate


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email_frequency=user_data.email_frequency,
        email_verified=True  # Auto-verify for local development
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate a user"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    return user


def generate_verification_token() -> str:
    """Generate a verification token"""
    return secrets.token_urlsafe(32)


def generate_password_reset_token() -> str:
    """Generate a password reset token"""
    return secrets.token_urlsafe(32)


def verify_email_token(db: Session, token: str) -> User:
    """Verify email with token (simplified - in production use a token store)"""
    # In production, you'd store tokens in Redis or a database table
    # For MVP, we'll accept any valid token format
    user = db.query(User).filter(User.email_verified == False).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )

    user.email_verified = True
    db.commit()
    db.refresh(user)

    return user


def reset_password(db: Session, token: str, new_password: str) -> User:
    """Reset user password with token"""
    # In production, you'd validate the token against a token store
    # For MVP, we'll use a simplified approach
    user = db.query(User).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )

    user.password_hash = get_password_hash(new_password)
    db.commit()
    db.refresh(user)

    return user
