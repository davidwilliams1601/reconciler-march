from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from sqlalchemy.orm import Session
import os

from app.core.dependencies import get_current_user, get_current_organization, get_db
from app.services.ocr import ocr_service
from app.db.models import User, Organization

router = APIRouter()

@router.post("/process")
async def process_invoice_ocr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Process an invoice using OCR to extract text and data.
    """
    # Check file type
    if not file.content_type in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are supported"
        )
    
    # Save file temporarily
    temp_file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    try:
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the invoice with OCR
        ocr_result = ocr_service.process_invoice(temp_file_path)
        
        return ocr_result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Extract plain text from an image or document.
    """
    # Check file type
    if not file.content_type in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are supported"
        )
    
    # Save file temporarily
    temp_file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    try:
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the invoice with OCR
        ocr_result = ocr_service.process_invoice(temp_file_path)
        
        return {
            "text": ocr_result["raw_text"],
            "confidence": ocr_result["confidence"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text: {str(e)}"
        )
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/extract-structured")
async def extract_structured_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Extract structured data from a document, identifying specific fields.
    """
    # Check file type
    if not file.content_type in ["application/pdf", "image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, JPEG, and PNG files are supported"
        )
    
    # Save file temporarily
    temp_file_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    try:
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the invoice with OCR
        ocr_result = ocr_service.process_invoice(temp_file_path)
        
        # Extract structured data
        extracted_data = ocr_result["extracted_data"]
        
        # Simplify the response for structured data API
        fields = {
            "invoice_number": extracted_data["detectedInvoiceNumber"],
            "vendor": extracted_data["detectedVendor"],
            "amount": str(extracted_data["detectedAmount"]),
            "date": extracted_data["detectedDate"],
        }
        
        return {
            "text": ocr_result["raw_text"],
            "fields": fields,
            "confidence": ocr_result["confidence"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting structured data: {str(e)}"
        )
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path) 