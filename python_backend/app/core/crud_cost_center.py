from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any

from app.core.crud import CRUDBase
from app.db.models import CostCenter
from app.core.schemas import CostCenterCreate, CostCenterUpdate

class CRUDCostCenter(CRUDBase[CostCenter, CostCenterCreate, CostCenterUpdate]):
    def get_by_organization(
        self, 
        db: Session, 
        organization_id: str,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "created_at",
        sort_desc: bool = True,
        active_only: bool = True
    ) -> List[CostCenter]:
        """Get cost centers for a specific organization."""
        sort_column = getattr(CostCenter, sort_by)
        query = db.query(CostCenter).filter(CostCenter.organization_id == organization_id)
        
        if active_only:
            query = query.filter(CostCenter.active == True)
        
        if sort_desc:
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
            
        return query.offset(skip).limit(limit).all()
    
    def get_count_by_organization(
        self, 
        db: Session, 
        organization_id: str,
        active_only: bool = True
    ) -> int:
        """Get count of cost centers for a specific organization."""
        query = db.query(CostCenter).filter(CostCenter.organization_id == organization_id)
        
        if active_only:
            query = query.filter(CostCenter.active == True)
            
        return query.count()
    
    def get_by_code(
        self, 
        db: Session, 
        organization_id: str,
        code: str
    ) -> Optional[CostCenter]:
        """Get a cost center by its code within an organization."""
        return db.query(CostCenter).filter(
            CostCenter.organization_id == organization_id,
            CostCenter.code == code
        ).first()
    
    def get_active_codes(
        self, 
        db: Session, 
        organization_id: str
    ) -> List[str]:
        """Get all active cost center codes for an organization."""
        cost_centers = db.query(CostCenter.code).filter(
            CostCenter.organization_id == organization_id,
            CostCenter.active == True
        ).all()
        
        return [cc[0] for cc in cost_centers]

# Create singleton instance
cost_center = CRUDCostCenter(CostCenter) 