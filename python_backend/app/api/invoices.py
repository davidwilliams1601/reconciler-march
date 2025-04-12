from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.core.crud_invoice import invoice
from app.core.crud_cost_center import cost_center
from app.core.schemas import Invoice, InvoiceCreate, InvoiceUpdate, PaginatedResponse
from app.db.models import User, Organization

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
def read_invoices(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_desc: bool = Query(True, description="Sort in descending order"),
    invoice_number: Optional[str] = Query(None, description="Filter by invoice number"),
    vendor: Optional[str] = Query(None, description="Filter by vendor name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum amount"),
    max_amount: Optional[float] = Query(None, description="Filter by maximum amount"),
    date_from: Optional[date] = Query(None, description="Filter by start date"),
    date_to: Optional[date] = Query(None, description="Filter by end date"),
    reconciled: Optional[bool] = Query(None, description="Filter by reconciliation status"),
    cost_center_code: Optional[str] = Query(None, description="Filter by cost center code"),
) -> Any:
    """
    Get all invoices for the current organization with pagination and filtering.
    """
    # Prepare filters
    filters = {}
    if invoice_number:
        filters["invoice_number"] = invoice_number
    if vendor:
        filters["vendor"] = vendor
    if status:
        filters["status"] = status
    if min_amount is not None:
        filters["min_amount"] = min_amount
    if max_amount is not None:
        filters["max_amount"] = max_amount
    if date_from:
        filters["date_from"] = datetime.combine(date_from, datetime.min.time())
    if date_to:
        filters["date_to"] = datetime.combine(date_to, datetime.max.time())
    if reconciled is not None:
        filters["reconciled"] = reconciled
    if cost_center_code:
        filters["cost_center"] = cost_center_code
    
    # Get invoices with filters
    items = invoice.get_by_organization(
        db=db,
        organization_id=organization.id,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_desc=sort_desc,
        filters=filters
    )
    
    # Get total count
    total = invoice.get_count_by_organization(
        db=db,
        organization_id=organization.id,
        filters=filters
    )
    
    # Calculate total pages
    pages = (total + limit - 1) // limit if limit > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "size": limit,
        "pages": pages
    }

@router.post("", response_model=Invoice)
def create_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_in: InvoiceCreate,
) -> Any:
    """
    Create a new invoice.
    """
    # Ensure the invoice belongs to the current organization
    invoice_in.organization_id = organization.id
    
    # Validate cost center if provided
    if invoice_in.cost_center:
        cc = cost_center.get_by_code(
            db=db, 
            organization_id=organization.id, 
            code=invoice_in.cost_center
        )
        if not cc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cost center with code {invoice_in.cost_center} not found"
            )
    
    # Create the invoice
    invoice_obj = invoice.create(db=db, obj_in=invoice_in)
    return invoice_obj

@router.get("/{invoice_id}", response_model=Invoice)
def read_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_id: str,
) -> Any:
    """
    Get an invoice by ID.
    """
    invoice_obj = invoice.get(db=db, id=invoice_id)
    if not invoice_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if the invoice belongs to the current organization
    if invoice_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invoice not found in current organization"
        )
    
    return invoice_obj

@router.put("/{invoice_id}", response_model=Invoice)
def update_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_id: str,
    invoice_in: InvoiceUpdate,
) -> Any:
    """
    Update an invoice.
    """
    invoice_obj = invoice.get(db=db, id=invoice_id)
    if not invoice_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if the invoice belongs to the current organization
    if invoice_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invoice not found in current organization"
        )
    
    # Validate cost center if provided
    if invoice_in.cost_center:
        cc = cost_center.get_by_code(
            db=db, 
            organization_id=organization.id, 
            code=invoice_in.cost_center
        )
        if not cc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cost center with code {invoice_in.cost_center} not found"
            )
    
    # Update the invoice
    invoice_obj = invoice.update(db=db, db_obj=invoice_obj, obj_in=invoice_in)
    return invoice_obj

@router.delete("/{invoice_id}", response_model=Invoice)
def delete_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_id: str,
) -> Any:
    """
    Delete an invoice.
    """
    invoice_obj = invoice.get(db=db, id=invoice_id)
    if not invoice_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if the invoice belongs to the current organization
    if invoice_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invoice not found in current organization"
        )
    
    # Delete the invoice
    invoice_obj = invoice.remove(db=db, id=invoice_id)
    return invoice_obj

@router.post("/{invoice_id}/reconcile", response_model=Invoice)
def reconcile_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    invoice_id: str,
    xero_invoice_id: Optional[str] = Form(None),
) -> Any:
    """
    Mark an invoice as reconciled.
    """
    invoice_obj = invoice.get(db=db, id=invoice_id)
    if not invoice_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if the invoice belongs to the current organization
    if invoice_obj.organization_id != organization.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invoice not found in current organization"
        )
    
    # Check if the invoice is already reconciled
    if invoice_obj.reconciled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already reconciled"
        )
    
    # Mark the invoice as reconciled
    invoice_obj = invoice.mark_reconciled(
        db=db, 
        db_obj=invoice_obj, 
        reconciled_by=current_user.id,
        xero_invoice_id=xero_invoice_id
    )
    
    return invoice_obj 