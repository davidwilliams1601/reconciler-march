from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from .database import Base

# Helper function to generate UUID
def generate_uuid():
    return str(uuid.uuid4())

# Organization model
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="organization")
    settings = relationship("OrganizationSettings", back_populates="organization", uselist=False)
    invoices = relationship("Invoice", back_populates="organization")

# User model
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    organization_id = Column(String, ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")

# Organization Settings model
class OrganizationSettings(Base):
    __tablename__ = "organization_settings"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), unique=True)
    
    # Xero integration settings
    xero_client_id = Column(String, nullable=True)
    xero_client_secret = Column(String, nullable=True)
    xero_tenant_id = Column(String, nullable=True)
    xero_tenant_name = Column(String, nullable=True)
    xero_refresh_token = Column(String, nullable=True)
    xero_access_token = Column(String, nullable=True)
    xero_token_expiry = Column(DateTime, nullable=True)
    
    # Google Vision settings
    google_vision_api_key = Column(String, nullable=True)
    
    # Reconciliation settings
    reconciliation_confidence_threshold = Column(Float, default=0.9)
    auto_reconcile = Column(Boolean, default=False)
    
    # Email processing settings
    email_enabled = Column(Boolean, default=False)
    email_address = Column(String, nullable=True)
    email_password = Column(String, nullable=True)
    email_server = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="settings")

# Invoice model
class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"))
    
    # Invoice details
    invoice_number = Column(String, index=True)
    vendor = Column(String, index=True)
    amount = Column(Float)
    currency = Column(String, default="GBP")
    issue_date = Column(DateTime)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending")  # pending, review, approved, reconciled, rejected
    
    # OCR and processing data
    file_path = Column(String, nullable=True)
    ocr_data = Column(JSON, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    
    # Cost center classification
    cost_center = Column(String, nullable=True)
    cost_center_confidence = Column(Float, nullable=True)
    cost_center_manually_set = Column(Boolean, default=False)
    
    # Xero reconciliation
    xero_invoice_id = Column(String, nullable=True)
    xero_contact_id = Column(String, nullable=True)
    xero_status = Column(String, nullable=True)
    reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime, nullable=True)
    reconciled_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="invoices")
    reconciler = relationship("User")

# Cost Center model
class CostCenter(Base):
    __tablename__ = "cost_centers"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"))
    code = Column(String)
    name = Column(String)
    description = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 