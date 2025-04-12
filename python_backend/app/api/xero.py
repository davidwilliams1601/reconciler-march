from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.services.xero_service import xero_service
from app.core.crud_organization import organization_settings
from app.db.models import User, Organization

router = APIRouter()

@router.get("/auth-url")
def get_xero_auth_url(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get the Xero OAuth2 authorization URL.
    """
    # In a real implementation, this would generate a proper OAuth2 URL
    return {
        "auth_url": "https://login.xero.com/identity/connect/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=offline_access+accounting.transactions+accounting.settings",
        "message": "This is a mock authentication URL. In a real implementation, this would redirect to Xero for authentication."
    }

@router.post("/token")
def exchange_auth_code(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    code: str = Form(...),
) -> Dict[str, Any]:
    """
    Exchange an authorization code for a Xero OAuth2 token.
    """
    # Get the organization settings
    settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization settings not found"
        )
    
    # In a real implementation, this would exchange the code for a token
    # For now, we'll return mock data
    auth_result = xero_service.authenticate()
    
    # Update the organization settings with the token
    organization_settings.update(db, db_obj=settings, obj_in={
        "xero_refresh_token": auth_result["refresh_token"],
        "xero_token_expiry": datetime.fromtimestamp(auth_result["expires_at"]),
    })
    
    return {
        "access_token": auth_result["access_token"],
        "refresh_token": auth_result["refresh_token"],
        "expires_at": auth_result["expires_at"],
        "token_type": auth_result["token_type"],
    }

@router.get("/invoices")
def get_xero_invoices(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """
    Get invoices from Xero.
    """
    # Get the organization settings
    settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    if not settings or not settings.xero_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xero integration not configured"
        )
    
    # Refresh the token if needed
    if not settings.xero_token_expiry or settings.xero_token_expiry < datetime.now():
        auth_result = xero_service.authenticate(refresh_token=settings.xero_refresh_token)
        
        # Update the organization settings with the new token
        organization_settings.update(db, db_obj=settings, obj_in={
            "xero_refresh_token": auth_result["refresh_token"],
            "xero_token_expiry": datetime.fromtimestamp(auth_result["expires_at"]),
        })
    
    # Get the invoices from Xero
    return xero_service.get_invoices(token="mock_token", tenant_id=settings.xero_tenant_id or "mock_tenant")

@router.get("/bank-transactions")
def get_xero_bank_transactions(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    from_date: datetime = Query(None, description="Filter transactions from this date"),
    to_date: datetime = Query(None, description="Filter transactions to this date"),
) -> List[Dict[str, Any]]:
    """
    Get bank transactions from Xero.
    """
    # Get the organization settings
    settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    if not settings or not settings.xero_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xero integration not configured"
        )
    
    # Refresh the token if needed
    if not settings.xero_token_expiry or settings.xero_token_expiry < datetime.now():
        auth_result = xero_service.authenticate(refresh_token=settings.xero_refresh_token)
        
        # Update the organization settings with the new token
        organization_settings.update(db, db_obj=settings, obj_in={
            "xero_refresh_token": auth_result["refresh_token"],
            "xero_token_expiry": datetime.fromtimestamp(auth_result["expires_at"]),
        })
    
    # Get the bank transactions from Xero
    return xero_service.get_bank_transactions(
        token="mock_token", 
        tenant_id=settings.xero_tenant_id or "mock_tenant",
        from_date=from_date,
        to_date=to_date
    )

@router.post("/reconcile")
def reconcile_xero_invoice(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_id: str = Form(...),
    bank_transaction_id: str = Form(...),
) -> Dict[str, Any]:
    """
    Reconcile an invoice with a bank transaction in Xero.
    """
    # Get the organization settings
    settings = organization_settings.get_by_organization(db, organization_id=organization.id)
    if not settings or not settings.xero_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Xero integration not configured"
        )
    
    # Refresh the token if needed
    if not settings.xero_token_expiry or settings.xero_token_expiry < datetime.now():
        auth_result = xero_service.authenticate(refresh_token=settings.xero_refresh_token)
        
        # Update the organization settings with the new token
        organization_settings.update(db, db_obj=settings, obj_in={
            "xero_refresh_token": auth_result["refresh_token"],
            "xero_token_expiry": datetime.fromtimestamp(auth_result["expires_at"]),
        })
    
    # Reconcile the invoice in Xero
    return xero_service.reconcile_invoice(
        token="mock_token", 
        tenant_id=settings.xero_tenant_id or "mock_tenant",
        invoice_id=invoice_id,
        bank_transaction_id=bank_transaction_id
    ) 