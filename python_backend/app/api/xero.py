from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Form, status
from sqlalchemy.orm import Session
from datetime import datetime
import os
import logging
import traceback

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.services.xero_service import xero_service
from app.core.crud_organization import organization_settings
from app.db.models import User, Organization

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/status")
async def check_xero_status(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
) -> Dict[str, Any]:
    """
    Check the status of the Xero connection.
    """
    try:
        settings = organization_settings.get_by_organization(db, organization_id=organization.id)
        
        # Check if we have a refresh token
        if not settings or not settings.xero_refresh_token:
            return {
                "connected": False,
                "message": "Not connected to Xero"
            }
        
        # Check if the token is expired
        is_expired = not settings.xero_token_expiry or settings.xero_token_expiry < datetime.now()
        
        # Get tenant name if available
        tenant_name = settings.xero_tenant_name if settings and hasattr(settings, 'xero_tenant_name') else None
        
        return {
            "connected": True,
            "tokenExpiry": settings.xero_token_expiry.isoformat() if settings.xero_token_expiry else None,
            "tenantId": settings.xero_tenant_id,
            "tenantName": tenant_name,
            "isExpired": is_expired,
            "message": "Connected to Xero" + (" (token expired)" if is_expired else "")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking Xero status: {str(e)}"
        )

@router.get("/auth-url")
async def get_auth_url(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
) -> Dict[str, Any]:
    """
    Get the Xero OAuth2 authorization URL.
    """
    try:
        # Make sure we have a valid organization
        if not organization or not organization.id:
            logger.warning("No valid organization found when getting auth URL")
            return {
                "auth_url": "#",
                "message": "No valid organization found. Please configure your organization first."
            }
            
        # Try to get organization-specific redirect URI
        org_settings = organization_settings.get_by_organization(db, organization_id=organization.id)
        
        # Set default redirect URI based on request
        if org_settings and not org_settings.xero_redirect_uri:
            # Set a default redirect URI if none is configured
            base_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
            default_redirect_uri = f"{base_url}/xero-callback"
            
            # Update the settings with default redirect URI
            organization_settings.update(
                db,
                db_obj=org_settings,
                obj_in={"xero_redirect_uri": default_redirect_uri}
            )
            
            logger.info(f"Set default redirect URI: {default_redirect_uri}")
            
        # Get auth URL
        auth_url = xero_service.get_authorization_url(organization.id)
        
        return {
            "auth_url": auth_url,
            "message": "Please visit this URL to authorize access to your Xero account."
        }
    except Exception as e:
        logger.error(f"Error generating authorization URL: {str(e)}", exc_info=True)
        # Return a mock URL for development and to prevent breaking the frontend
        return {
            "auth_url": "#",
            "message": f"Error: {str(e)}. Please check your Xero configuration settings."
        }

@router.post("/token")
async def exchange_auth_code(
    code: str = Form(...),
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Exchange the OAuth2 authorization code for access tokens.
    """
    try:
        token_set = xero_service.exchange_code_for_token(code, organization.id)
        return token_set
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exchanging authorization code: {str(e)}"
        )

@router.post("/disconnect")
async def disconnect_xero(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Disconnect from Xero by removing stored tokens.
    """
    try:
        settings = organization_settings.get_by_organization(db, organization_id=organization.id)
        
        if settings:
            # Clear Xero-related fields
            organization_settings.update(
                db,
                db_obj=settings,
                obj_in={
                    "xero_access_token": None,
                    "xero_refresh_token": None,
                    "xero_token_expiry": None,
                    "xero_tenant_id": None,
                    "xero_tenant_name": None
                }
            )
        
        return {
            "success": True,
            "message": "Successfully disconnected from Xero"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error disconnecting from Xero: {str(e)}"
        )

@router.post("/refresh-token")
async def refresh_xero_token(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Refresh the Xero access token.
    """
    try:
        settings = organization_settings.get_by_organization(db, organization_id=organization.id)
        
        if not settings or not settings.xero_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Xero connection found to refresh"
            )
        
        # Refresh the token
        access_token = xero_service._refresh_token(db, settings)
        
        # Get updated settings
        updated_settings = organization_settings.get_by_organization(db, organization_id=organization.id)
        
        return {
            "success": True,
            "message": "Successfully refreshed Xero token",
            "tokenExpiry": updated_settings.xero_token_expiry.isoformat() if updated_settings.xero_token_expiry else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing Xero token: {str(e)}"
        )

@router.get("/invoices")
async def get_invoices(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by invoice status"),
    contact_id: Optional[str] = Query(None, description="Filter by contact ID"),
    date_from: Optional[str] = Query(None, description="Filter by date (from)"),
    date_to: Optional[str] = Query(None, description="Filter by date (to)"),
) -> List[Dict[str, Any]]:
    """
    Get invoices from Xero.
    """
    try:
        invoices = xero_service.get_invoices(
            organization_id=organization.id,
            status=status,
            contact_id=contact_id,
            date_from=date_from,
            date_to=date_to
        )
        return invoices
    except Exception as e:
        # Check for "not connected" type errors
        error_msg = str(e).lower()
        if "not configured" in error_msg or "no xero connections" in error_msg:
            # Return empty list instead of error for better UI handling
            return []
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching invoices from Xero: {str(e)}"
        )

@router.get("/bank-transactions")
async def get_bank_transactions(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, description="Filter by date (from)"),
    to_date: Optional[str] = Query(None, description="Filter by date (to)"),
) -> List[Dict[str, Any]]:
    """
    Get bank transactions from Xero.
    """
    try:
        transactions = xero_service.get_bank_transactions(
            organization_id=organization.id,
            from_date=from_date,
            to_date=to_date
        )
        return transactions
    except Exception as e:
        # Check for "not connected" type errors
        error_msg = str(e).lower()
        if "not configured" in error_msg or "no xero connections" in error_msg:
            # Return empty list instead of error for better UI handling
            return []
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bank transactions from Xero: {str(e)}"
        )

@router.post("/reconcile")
async def reconcile_invoice(
    invoice_id: str = Form(...),
    bank_transaction_id: str = Form(...),
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Reconcile an invoice with a bank transaction in Xero.
    """
    try:
        result = xero_service.reconcile_invoice(
            organization_id=organization.id,
            invoice_id=invoice_id,
            bank_transaction_id=bank_transaction_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reconciling invoice in Xero: {str(e)}"
        )

@router.get("/debug", include_in_schema=False)
async def debug_xero_configuration(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
) -> Dict[str, Any]:
    """
    Debug endpoint to check Xero configuration.
    Not for production use.
    """
    try:
        # Get configuration values (sanitized)
        return {
            "client_id_configured": bool(xero_service.client_id),
            "client_secret_configured": bool(xero_service.client_secret),
            "redirect_uri": xero_service.redirect_uri,
            "scope": xero_service.scope,
            "environment_vars": {
                "XERO_CLIENT_ID": bool(os.environ.get("XERO_CLIENT_ID")),
                "XERO_CLIENT_SECRET": bool(os.environ.get("XERO_CLIENT_SECRET")),
                "XERO_REDIRECT_URI": os.environ.get("XERO_REDIRECT_URI"),
            },
            "settings": {
                "has_org_settings": bool(organization_settings.get_by_organization(db, organization_id=organization.id)),
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@router.get("/callback")
async def xero_callback(
    code: str,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Handle the callback from Xero OAuth2 authorization.
    This is called by the redirect URI after the user authorizes the application.
    """
    try:
        # Extract organization ID from state parameter
        organization_id = None
        if state and state.startswith("org_"):
            organization_id = state[4:]
        
        if not organization_id:
            logger.error("No organization ID found in state parameter")
            return {
                "success": False,
                "message": "Invalid state parameter. Cannot identify your organization."
            }
        
        # Exchange the authorization code for tokens
        token_set = xero_service.exchange_code_for_token(code, organization_id)
        
        # Redirect to the dashboard or a success page
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        redirect_url = f"{frontend_url}/settings/xero?success=true"
        
        return {
            "success": True,
            "message": "Successfully connected to Xero",
            "token_set": token_set,
            "redirect_url": redirect_url
        }
    except Exception as e:
        logger.error(f"Error in Xero callback: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "redirect_url": f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/settings/xero?error=true"
        } 