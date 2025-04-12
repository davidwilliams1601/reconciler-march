from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_current_user, get_current_organization, get_db, get_current_active_admin
from app.services.email_service import email_processor
from app.services.ocr import ocr_service
from app.core.crud_invoice import invoice
from app.core.crud_cost_center import cost_center
from app.core.schemas import Invoice, InvoiceCreate
from app.db.models import User, Organization
from app.ml.cost_center_classifier import classifier

router = APIRouter()

@router.get("/settings")
def get_email_settings(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get email processing settings.
    """
    return {
        "enabled": email_processor.is_configured(),
        "server": email_processor.email_server,
        "email_address": email_processor.email_address,
        "folder": email_processor.email_folder,
    }

@router.post("/poll", response_model=List[Dict[str, Any]])
async def poll_emails(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_active_admin),  # Only admin can poll emails
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Poll for new emails with invoice attachments and process them.
    This is an admin-only endpoint that initiates the email polling process.
    """
    # Process emails as a background task to avoid blocking
    background_tasks.add_task(
        process_emails_and_create_invoices, 
        db=db, 
        organization=organization, 
        user_id=current_user.id,
        limit=limit
    )
    
    return [{"status": "Email polling started in background"}]

@router.post("/process-now")
async def process_emails_now(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_active_admin),  # Only admin can process emails
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Process emails immediately (not in the background).
    This is useful for testing and development.
    """
    results = await process_emails_and_create_invoices(
        db=db,
        organization=organization,
        user_id=current_user.id,
        limit=limit
    )
    
    return {
        "status": "Email processing completed",
        "processed_count": len(results),
        "invoices_created": [r['invoice'].invoice_number for r in results if 'invoice' in r],
        "errors": [r['error'] for r in results if 'error' in r]
    }

async def process_emails_and_create_invoices(
    db: Session,
    organization: Organization,
    user_id: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Background task to process emails and create invoices.
    """
    # Process emails to get invoice data
    invoice_data_list = email_processor.process_invoice_emails(limit=limit)
    
    results = []
    
    for inv_data in invoice_data_list:
        try:
            # Create invoice object
            extracted = inv_data["extracted_invoice"]
            
            # Parse date from string
            try:
                issue_date = datetime.strptime(extracted["date"], "%Y-%m-%d")
            except:
                issue_date = datetime.now()
            
            # Prepare invoice data
            new_invoice = InvoiceCreate(
                organization_id=organization.id,
                invoice_number=extracted["invoice_number"],
                vendor=extracted["vendor"],
                amount=extracted["amount"],
                currency="GBP",  # Default currency
                issue_date=issue_date,
                due_date=None,  # We don't extract due date from OCR yet
                file_path=inv_data["attachment"]["saved_path"],
                status="pending"
            )
            
            # Predict cost center
            invoice_text = classifier.prepare_invoice_text({
                "vendor": extracted["vendor"],
                "invoice_number": extracted["invoice_number"],
                "amount": extracted["amount"],
                "ocr_data": inv_data["ocr_data"]
            })
            
            cost_center_code, confidence = classifier.predict(invoice_text)
            
            # Only set cost center if we have a prediction with good confidence
            if cost_center_code and confidence > 0.7:
                # Validate cost center exists
                cc = cost_center.get_by_code(
                    db=db, 
                    organization_id=organization.id, 
                    code=cost_center_code
                )
                
                if cc:
                    new_invoice.cost_center = cost_center_code
            
            # Save OCR data
            ocr_json = {
                "raw_text": inv_data["ocr_data"]["raw_text"],
                "confidence": inv_data["ocr_data"]["confidence"],
                "extracted_data": inv_data["ocr_data"]["extracted_data"],
                "processedAt": inv_data["ocr_data"]["processedAt"],
                "email_metadata": inv_data["email_metadata"]
            }
            
            # Create the invoice
            invoice_obj = invoice.create(db=db, obj_in=new_invoice)
            
            # Update with OCR data
            invoice.update(db=db, db_obj=invoice_obj, obj_in={
                "ocr_data": ocr_json,
                "ocr_confidence": extracted["confidence"],
            })
            
            results.append({
                "status": "success",
                "invoice": invoice_obj,
                "email_id": inv_data["email_metadata"]["subject"],
            })
            
        except Exception as e:
            results.append({
                "status": "error",
                "error": str(e),
                "email_id": inv_data["email_metadata"]["subject"] if "email_metadata" in inv_data else "unknown",
            })
    
    return results 