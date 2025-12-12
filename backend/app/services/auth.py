from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from app.models.user import User
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_token
)
from app.core.config import settings
from app.schemas.user import UserCreate
from app.services.email import (
    email_service,
    get_verification_email_template,
    get_password_reset_template
)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """Create a new user with hashed password and verification token."""
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create verification token
    verification_token = generate_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)

    # Create user
    db_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        verification_token=verification_token,
        verification_token_expires=verification_expires,
        email_verified=True  # Skip email verification for development
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Skip verification email for development
    # send_verification_email(db_user.email, verification_token)

    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user with email and password."""
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    # Skip email verification check for development
    # if not user.email_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Email not verified. Please check your email for verification link."
    #     )

    # Update last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    return user


def verify_email(db: Session, token: str) -> User:
    """Verify user email with token."""
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    if user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )

    # Mark email as verified
    user.email_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    db.refresh(user)

    return user


def send_verification_email(email: str, token: str):
    """Send verification email."""
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html_content = get_verification_email_template(link)

    email_service.send_email(
        to_email=email,
        subject="Verify your GovAI account",
        html_content=html_content
    )


def generate_password_reset(db: Session, email: str):
    """Generate password reset token and send email."""
    user = get_user_by_email(db, email)

    if not user:
        # Don't reveal if email exists or not for security
        return

    # Generate reset token
    reset_token = generate_token()
    reset_expires = datetime.utcnow() + timedelta(hours=1)

    user.password_reset_token = reset_token
    user.password_reset_expires = reset_expires
    db.commit()

    # Send reset email (console mode)
    send_password_reset_email(user.email, reset_token)


def send_password_reset_email(email: str, token: str):
    """Send password reset email."""
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html_content = get_password_reset_template(link)

    email_service.send_email(
        to_email=email,
        subject="Reset your GovAI password",
        html_content=html_content
    )


def reset_password(db: Session, token: str, new_password: str) -> User:
    """Reset user password with token."""
    user = db.query(User).filter(User.password_reset_token == token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    # Update password
    user.password_hash = get_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    db.refresh(user)

    return user
