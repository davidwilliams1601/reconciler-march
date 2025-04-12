import os
import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.core.crud_invoice import invoice
from app.core.schemas import Invoice, InvoiceCreate
from app.db.models import User, Organization

router = APIRouter()

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

@router.post("/invoice", response_model=Invoice)
async def upload_invoice(
    *,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    invoice_number: str = Form(...),
    vendor: str = Form(...),
    amount: float = Form(...),
    currency: str = Form("GBP"),
    issue_date: str = Form(...),
    due_date: str = Form(None),
    cost_center: str = Form(None),
    notes: str = Form(None),
) -> Any:
    """
    Upload an invoice file and create a new invoice record.
    """
    # Validate file
    if not file.content_type in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are supported"
        )
    
    # Save the file
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = f"uploads/{file_name}"
    
    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    
    # Parse dates
    try:
        issue_date_parsed = datetime.fromisoformat(issue_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid issue date format. Use ISO format (YYYY-MM-DD)"
        )
    
    due_date_parsed = None
    if due_date:
        try:
            due_date_parsed = datetime.fromisoformat(due_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid due date format. Use ISO format (YYYY-MM-DD)"
            )
    
    # Create invoice object
    invoice_data = InvoiceCreate(
        organization_id=organization.id,
        invoice_number=invoice_number,
        vendor=vendor,
        amount=amount,
        currency=currency,
        issue_date=issue_date_parsed,
        due_date=due_date_parsed,
        cost_center=cost_center,
        file_path=file_path,
        status="pending"
    )
    
    # TODO: In a production system, we would process the invoice with OCR here
    # and extract information automatically, then classify it
    
    # Create invoice in database
    invoice_obj = invoice.create(db=db, obj_in=invoice_data)
    return invoice_obj 