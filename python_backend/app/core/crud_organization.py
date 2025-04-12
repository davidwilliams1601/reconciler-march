from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.crud import CRUDBase
from app.db.models import Organization, OrganizationSettings
from app.core.schemas import OrganizationCreate, OrganizationUpdate
from app.core.schemas import OrganizationSettingsCreate, OrganizationSettingsUpdate

class CRUDOrganization(CRUDBase[Organization, OrganizationCreate, OrganizationUpdate]):
    def create_with_settings(
        self, db: Session, *, obj_in: OrganizationCreate
    ) -> Organization:
        """Create a new organization with default settings."""
        # Create the organization
        db_obj = Organization(name=obj_in.name)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Create default settings for the organization
        settings = OrganizationSettings(
            organization_id=db_obj.id,
            reconciliation_confidence_threshold=0.9,
            auto_reconcile=False,
            email_enabled=False,
        )
        db.add(settings)
        db.commit()
        
        return db_obj

    def get_settings(self, db: Session, *, organization_id: str) -> Optional[OrganizationSettings]:
        """Get the settings for an organization."""
        return db.query(OrganizationSettings).filter(
            OrganizationSettings.organization_id == organization_id
        ).first()
    
    def update_settings(
        self, 
        db: Session, 
        *, 
        db_obj: OrganizationSettings, 
        obj_in: OrganizationSettingsUpdate
    ) -> OrganizationSettings:
        """Update the settings for an organization."""
        return super().update(db, db_obj=db_obj, obj_in=obj_in)
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Organization]:
        """Get an organization by name."""
        return db.query(Organization).filter(Organization.name == name).first()

# Create singleton instances
organization = CRUDOrganization(Organization)

class CRUDOrganizationSettings(CRUDBase[OrganizationSettings, OrganizationSettingsCreate, OrganizationSettingsUpdate]):
    def get_by_organization(self, db: Session, *, organization_id: str) -> Optional[OrganizationSettings]:
        """Get the settings for an organization."""
        return db.query(OrganizationSettings).filter(
            OrganizationSettings.organization_id == organization_id
        ).first()

# Create singleton instance
organization_settings = CRUDOrganizationSettings(OrganizationSettings) 