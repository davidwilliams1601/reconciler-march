from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.core.crud_invoice import invoice
from app.db.models import User, Organization

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get dashboard statistics for the current organization.
    
    Returns:
        - totalInvoices: Total number of invoices
        - pendingInvoices: Number of invoices pending review
        - processedInvoices: Number of processed invoices
        - totalAmount: Total amount of all invoices
        - currency: Currency used
        - recentInvoices: List of recent invoices
    """
    return invoice.get_dashboard_stats(db, organization.id) 