from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..schemas.user import User as UserSchema, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserSchema)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserSchema)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Update user fields
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name

    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name

    if user_update.email_frequency is not None:
        current_user.email_frequency = user_update.email_frequency

    db.commit()
    db.refresh(current_user)

    return current_user


@router.put("/me/preferences", response_model=UserSchema)
def update_user_preferences(
    email_frequency: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user email preferences"""
    current_user.email_frequency = email_frequency
    db.commit()
    db.refresh(current_user)

    return current_user
