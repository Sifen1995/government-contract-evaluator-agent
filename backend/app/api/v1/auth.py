from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.core.security import create_access_token
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse
)
from app.schemas.user import UserResponse, UserUpdate
from app.services import auth as auth_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user.

    - Creates user account
    - Sends verification email (console mode in development)
    - Returns user object
    """
    user = auth_service.create_user(db, user_data)
    return user


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Verify user email with token.

    - Validates verification token
    - Marks email as verified
    - Returns success message
    """
    auth_service.verify_email(db, data.token)
    return MessageResponse(message="Email verified successfully")


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.

    - Validates credentials
    - Checks email verification
    - Returns JWT access token and user object
    """
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.id})

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user.

    - Currently stateless (client should delete token)
    - Future: Implement token blacklist
    """
    return MessageResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("3/minute")
def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset.

    - Generates reset token
    - Sends reset email (console mode in development)
    - Returns success message (doesn't reveal if email exists)
    """
    auth_service.generate_password_reset(db, data.email)
    return MessageResponse(message="If the email exists, a password reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password with token.

    - Validates reset token
    - Updates password
    - Returns success message
    """
    auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(message="Password reset successfully")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user.

    - Requires valid JWT token
    - Returns user object
    """
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current authenticated user.

    - Updates first_name, last_name, email_frequency
    - Returns updated user object
    """
    # Update user fields
    update_data = user_data.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    return current_user
