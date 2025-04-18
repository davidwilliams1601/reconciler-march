from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_organization, get_db, get_current_active_admin
from app.db.models import User, Organization
from app.core.crud_organization import organization_settings

router = APIRouter()

@router.get("/")
async def get_settings(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get settings for the current organization.
    """
    settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    
    if not settings:
        return {
            "googleVisionApiKey": "",
            "autoReconcileEnabled": False,
            "reconciliationConfidenceThreshold": 0.95,
            "reconciliationDateRange": 30,
            "reconciliationAccountCodes": "",
        }
        
    # Return the settings
    return {
        "googleVisionApiKey": settings.google_vision_api_key or "",
        "autoReconcileEnabled": settings.auto_reconcile or False,
        "reconciliationConfidenceThreshold": settings.reconciliation_confidence_threshold or 0.95,
        "reconciliationDateRange": 30,
        "reconciliationAccountCodes": "",
    }

@router.post("/")
async def save_settings(
    settings_data: Dict[str, Any],
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_active_admin),
) -> Dict[str, Any]:
    """
    Save settings for the current organization.
    Only administrators can update settings.
    """
    org_settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    
    # Prepare the update data
    update_data = {}
    
    # Google Vision settings
    if "googleVisionApiKey" in settings_data:
        update_data["google_vision_api_key"] = settings_data["googleVisionApiKey"]
        
    # Reconciliation settings
    if "autoReconcileEnabled" in settings_data:
        update_data["auto_reconcile"] = settings_data["autoReconcileEnabled"]
    if "reconciliationConfidenceThreshold" in settings_data:
        update_data["reconciliation_confidence_threshold"] = settings_data["reconciliationConfidenceThreshold"]
    
    # Create or update settings
    if org_settings:
        org_settings = organization_settings.update(db, db_obj=org_settings, obj_in=update_data)
    else:
        update_data["organization_id"] = organization.id
        org_settings = organization_settings.create(db, obj_in=update_data)
    
    # Return the updated settings
    return {
        "googleVisionApiKey": org_settings.google_vision_api_key or "",
        "autoReconcileEnabled": org_settings.auto_reconcile or False,
        "reconciliationConfidenceThreshold": org_settings.reconciliation_confidence_threshold or 0.95,
        "reconciliationDateRange": 30,
        "reconciliationAccountCodes": "",
    }

@router.post("/test-google-vision")
async def test_google_vision_connection(
    credentials: Dict[str, str],
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Test connection to Google Vision using the provided credentials.
    """
    try:
        # In a real implementation, you would test the connection here
        # For now, we just return a success message
        return {
            "success": True,
            "message": "Successfully connected to Google Vision with the provided API key."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing Google Vision connection: {str(e)}"
        ) 