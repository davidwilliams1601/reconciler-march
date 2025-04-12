from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, and_
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.crud import CRUDBase
from app.db.models import Invoice
from app.core.schemas import InvoiceCreate, InvoiceUpdate

class CRUDInvoice(CRUDBase[Invoice, InvoiceCreate, InvoiceUpdate]):
    def get_by_organization(
        self, 
        db: Session, 
        organization_id: str,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_desc: bool = True,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Invoice]:
        """Get invoices for a specific organization with filtering options."""
        sort_column = getattr(Invoice, sort_by)
        query = db.query(Invoice).filter(Invoice.organization_id == organization_id)
        
        # Apply filters if provided
        if filters:
            if filters.get("vendor"):
                query = query.filter(Invoice.vendor.ilike(f"%{filters['vendor']}%"))
            
            if filters.get("status"):
                query = query.filter(Invoice.status == filters["status"])
            
            if filters.get("invoice_number"):
                query = query.filter(Invoice.invoice_number.ilike(f"%{filters['invoice_number']}%"))
            
            if filters.get("min_amount") is not None:
                query = query.filter(Invoice.amount >= filters["min_amount"])
            
            if filters.get("max_amount") is not None:
                query = query.filter(Invoice.amount <= filters["max_amount"])
            
            if filters.get("date_from"):
                query = query.filter(Invoice.issue_date >= filters["date_from"])
            
            if filters.get("date_to"):
                query = query.filter(Invoice.issue_date <= filters["date_to"])
            
            if filters.get("reconciled") is not None:
                query = query.filter(Invoice.reconciled == filters["reconciled"])
            
            if filters.get("cost_center"):
                query = query.filter(Invoice.cost_center == filters["cost_center"])
        
        # Apply sorting
        if sort_desc:
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        return query.offset(skip).limit(limit).all()
    
    def get_count_by_organization(
        self, 
        db: Session, 
        organization_id: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """Get count of invoices for a specific organization with filtering options."""
        query = db.query(Invoice).filter(Invoice.organization_id == organization_id)
        
        # Apply filters if provided
        if filters:
            if filters.get("vendor"):
                query = query.filter(Invoice.vendor.ilike(f"%{filters['vendor']}%"))
            
            if filters.get("status"):
                query = query.filter(Invoice.status == filters["status"])
            
            if filters.get("invoice_number"):
                query = query.filter(Invoice.invoice_number.ilike(f"%{filters['invoice_number']}%"))
            
            if filters.get("min_amount") is not None:
                query = query.filter(Invoice.amount >= filters["min_amount"])
            
            if filters.get("max_amount") is not None:
                query = query.filter(Invoice.amount <= filters["max_amount"])
            
            if filters.get("date_from"):
                query = query.filter(Invoice.issue_date >= filters["date_from"])
            
            if filters.get("date_to"):
                query = query.filter(Invoice.issue_date <= filters["date_to"])
            
            if filters.get("reconciled") is not None:
                query = query.filter(Invoice.reconciled == filters["reconciled"])
            
            if filters.get("cost_center"):
                query = query.filter(Invoice.cost_center == filters["cost_center"])
        
        return query.count()
    
    def get_dashboard_stats(self, db: Session, organization_id: str) -> Dict[str, Any]:
        """Get dashboard statistics for a specific organization."""
        total_invoices = db.query(Invoice).filter(
            Invoice.organization_id == organization_id
        ).count()
        
        pending_invoices = db.query(Invoice).filter(
            and_(
                Invoice.organization_id == organization_id,
                Invoice.status.in_(["pending", "review"])
            )
        ).count()
        
        processed_invoices = db.query(Invoice).filter(
            and_(
                Invoice.organization_id == organization_id,
                Invoice.status.in_(["approved", "reconciled"])
            )
        ).count()
        
        total_amount = db.query(Invoice).filter(
            Invoice.organization_id == organization_id
        ).with_entities(
            Invoice.amount
        ).all()
        
        # Convert list of tuples to sum
        total_amount_sum = sum([amount[0] for amount in total_amount]) if total_amount else 0
        
        # Get recent invoices
        recent_invoices = db.query(Invoice).filter(
            Invoice.organization_id == organization_id
        ).order_by(
            desc(Invoice.created_at)
        ).limit(5).all()
        
        return {
            "totalInvoices": total_invoices,
            "pendingInvoices": pending_invoices,
            "processedInvoices": processed_invoices,
            "totalAmount": total_amount_sum,
            "currency": "GBP",  # Default currency
            "recentInvoices": recent_invoices
        }
    
    def mark_reconciled(
        self, 
        db: Session, 
        db_obj: Invoice, 
        reconciled_by: str,
        xero_invoice_id: Optional[str] = None
    ) -> Invoice:
        """Mark an invoice as reconciled."""
        db_obj.reconciled = True
        db_obj.status = "reconciled"
        db_obj.reconciled_at = datetime.utcnow()
        db_obj.reconciled_by = reconciled_by
        
        if xero_invoice_id:
            db_obj.xero_invoice_id = xero_invoice_id
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

# Create singleton instance
invoice = CRUDInvoice(Invoice) 