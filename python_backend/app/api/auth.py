from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.core.dependencies import get_current_user, get_db
from app.core.crud_user import user
from app.core.crud_organization import organization
from app.core.schemas import Token, User, UserCreate, UserUpdate
from app.db.models import User as UserModel

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    authenticated_user = user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active(authenticated_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    # Create access token with user's information
    access_token = create_access_token(
        subject=authenticated_user.id,
        organization_id=authenticated_user.organization_id,
        is_admin=authenticated_user.is_admin
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/register", response_model=User)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    
    # If no organization ID provided, create a new organization
    if not user_in.organization_id:
        # Create a new organization for the user
        org_name = f"{user_in.email.split('@')[0]}'s Organization"
        org = organization.create_with_settings(db, obj_in={"name": org_name})
        user_in.organization_id = org.id
    
    # Create the new user
    new_user = user.create(db, obj_in=user_in)
    return new_user

@router.get("/me", response_model=User)
def read_users_me(
    current_user: UserModel = Depends(get_current_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
    user_in: UserUpdate,
) -> Any:
    """
    Update current user.
    """
    # Prevent changing admin status by users themselves
    if not current_user.is_admin and user_in.is_admin is not None:
        user_in.is_admin = current_user.is_admin
    
    # Update the user
    updated_user = user.update(db, db_obj=current_user, obj_in=user_in)
    return updated_user 