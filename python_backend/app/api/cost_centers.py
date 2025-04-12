from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.core.crud_cost_center import cost_center
from app.core.schemas import CostCenter, CostCenterCreate, CostCenterUpdate
from app.db.models import User, Organization

router = APIRouter()

@router.get("", response_model=List[CostCenter])
def read_cost_centers(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: str = Query("code", description="Field to sort by"),
    sort_desc: bool = Query(False, description="Sort in descending order"),
    active_only: bool = Query(True, description="Only return active cost centers"),
) -> Any:
    """
    Get all cost centers for the current organization.
    """
    return cost_center.get_by_organization(
        db=db,
        organization_id=organization.id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_desc=sort_desc,
        active_only=active_only
    )

@router.post("", response_model=CostCenter)
def create_cost_center(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    cost_center_in: CostCenterCreate,
) -> Any:
    """
    Create a new cost center.
    """
    # Check if cost center with this code already exists
    existing = cost_center.get_by_code(
        db=db, 
        organization_id=organization.id, 
        code=cost_center_in.code
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cost center with code {cost_center_in.code} already exists"
        )
    
    # Ensure the cost center belongs to the current organization
    cost_center_in.organization_id = organization.id
    
    # Create the cost center
    return cost_center.create(db=db, obj_in=cost_center_in)

@router.get("/{cost_center_id}", response_model=CostCenter)
def read_cost_center(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    cost_center_id: str,
) -> Any:
    """
    Get a cost center by ID.
    """
    cost_center_obj = cost_center.get(db=db, id=cost_center_id)
    if not cost_center_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    
    # Check if the cost center belongs to the current organization
    if cost_center_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cost center not found in current organization"
        )
    
    return cost_center_obj

@router.put("/{cost_center_id}", response_model=CostCenter)
def update_cost_center(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    cost_center_id: str,
    cost_center_in: CostCenterUpdate,
) -> Any:
    """
    Update a cost center.
    """
    cost_center_obj = cost_center.get(db=db, id=cost_center_id)
    if not cost_center_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    
    # Check if the cost center belongs to the current organization
    if cost_center_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cost center not found in current organization"
        )
    
    # Check for code uniqueness if code is being updated
    if cost_center_in.code and cost_center_in.code != cost_center_obj.code:
        existing = cost_center.get_by_code(
            db=db, 
            organization_id=organization.id, 
            code=cost_center_in.code
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cost center with code {cost_center_in.code} already exists"
            )
    
    # Update the cost center
    return cost_center.update(db=db, db_obj=cost_center_obj, obj_in=cost_center_in)

@router.delete("/{cost_center_id}", response_model=CostCenter)
def delete_cost_center(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    cost_center_id: str,
) -> Any:
    """
    Delete a cost center.
    """
    cost_center_obj = cost_center.get(db=db, id=cost_center_id)
    if not cost_center_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost center not found"
        )
    
    # Check if the cost center belongs to the current organization
    if cost_center_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cost center not found in current organization"
        )
    
    # Delete the cost center
    return cost_center.remove(db=db, id=cost_center_id) 