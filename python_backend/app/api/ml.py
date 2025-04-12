from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Form, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_current_user, get_current_organization, get_db, get_current_active_admin
from app.ml.cost_center_classifier import classifier
from app.core.crud_invoice import invoice
from app.core.crud_cost_center import cost_center
from app.db.models import User, Organization, Invoice

router = APIRouter()

@router.post("/train-cost-center")
async def train_cost_center_model(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_active_admin),  # Only admin can train model
) -> Dict[str, Any]:
    """
    Train the cost center classification model based on existing invoices with assigned cost centers.
    This is an admin-only endpoint.
    """
    # Run training in the background
    background_tasks.add_task(
        train_cost_center_model_task,
        db=db,
        organization_id=organization.id
    )
    
    return {
        "status": "Training started in background",
        "message": "The model will be trained on all invoices with assigned cost centers."
    }

@router.post("/classify-invoice/{invoice_id}")
async def classify_invoice_cost_center(
    invoice_id: str,
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Classify an invoice's cost center using the ML model.
    This will not save the result, just return the prediction.
    """
    # Get the invoice
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
    
    # Prepare invoice text
    invoice_text = classifier.prepare_invoice_text({
        "vendor": invoice_obj.vendor,
        "invoice_number": invoice_obj.invoice_number,
        "amount": invoice_obj.amount,
        "ocr_data": invoice_obj.ocr_data if hasattr(invoice_obj, 'ocr_data') else None
    })
    
    # Get prediction
    cost_center_code, confidence = classifier.predict(invoice_text)
    
    # Check if the cost center exists
    cc = None
    if cost_center_code:
        cc = cost_center.get_by_code(
            db=db, 
            organization_id=organization.id, 
            code=cost_center_code
        )
    
    return {
        "invoice_id": invoice_id,
        "predicted_cost_center": cost_center_code,
        "confidence": confidence,
        "cost_center_exists": cc is not None,
        "cost_center_name": cc.name if cc else None
    }

@router.get("/model-info")
async def get_model_info(
    db: Session = Depends(get_db),
    organization: Organization = Depends(get_current_organization),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get information about the current ML model.
    """
    # Get number of invoices with cost centers assigned
    invoice_count = db.query(Invoice).filter(
        Invoice.organization_id == organization.id,
        Invoice.cost_center != None
    ).count()
    
    # Get all active cost centers
    all_cost_centers = cost_center.get_by_organization(
        db=db,
        organization_id=organization.id,
        active_only=True
    )
    
    # Get model details
    model_type = None
    feature_count = 0
    
    if classifier.model:
        if hasattr(classifier.model, 'steps'):
            model_type = classifier.model.steps[-1][1].__class__.__name__
            if hasattr(classifier.model.steps[0][1], 'vocabulary_'):
                feature_count = len(classifier.model.steps[0][1].vocabulary_)
    
    return {
        "model_type": model_type or "Not trained",
        "feature_count": feature_count,
        "training_data_count": invoice_count,
        "cost_centers_count": len(all_cost_centers),
        "cost_centers": [cc.code for cc in all_cost_centers]
    }

async def train_cost_center_model_task(db: Session, organization_id: str):
    """
    Background task to train the cost center classification model.
    """
    try:
        # Get all invoices with assigned cost centers
        invoices = db.query(Invoice).filter(
            Invoice.organization_id == organization_id,
            Invoice.cost_center != None
        ).all()
        
        if not invoices:
            print("No invoices with cost centers found for training.")
            return
        
        # Prepare training data
        texts = []
        labels = []
        
        for inv in invoices:
            # Prepare invoice text
            invoice_text = classifier.prepare_invoice_text({
                "vendor": inv.vendor,
                "invoice_number": inv.invoice_number,
                "amount": inv.amount,
                "ocr_data": inv.ocr_data if hasattr(inv, 'ocr_data') else None
            })
            
            texts.append(invoice_text)
            labels.append(inv.cost_center)
        
        # Train the model
        classifier.train(texts, labels)
        
        print(f"Cost center classification model trained on {len(texts)} invoices.")
        
    except Exception as e:
        print(f"Error training cost center model: {str(e)}") 