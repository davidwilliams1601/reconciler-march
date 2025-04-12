from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import re

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str
    exp: int
    organization_id: str
    is_admin: bool

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: bool = False

class UserCreate(UserBase):
    password: str
    organization_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserInDB(UserBase):
    id: str
    is_active: bool
    organization_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class User(UserInDB):
    pass

# Organization Schemas
class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None

class OrganizationInDB(OrganizationBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Organization(OrganizationInDB):
    pass

# Organization Settings Schemas
class OrganizationSettingsBase(BaseModel):
    xero_client_id: Optional[str] = None
    xero_client_secret: Optional[str] = None
    xero_tenant_id: Optional[str] = None
    google_vision_api_key: Optional[str] = None
    reconciliation_confidence_threshold: float = 0.9
    auto_reconcile: bool = False
    email_enabled: bool = False
    email_address: Optional[str] = None
    email_server: Optional[str] = None

class OrganizationSettingsCreate(OrganizationSettingsBase):
    organization_id: str
    email_password: Optional[str] = None

class OrganizationSettingsUpdate(BaseModel):
    xero_client_id: Optional[str] = None
    xero_client_secret: Optional[str] = None
    xero_tenant_id: Optional[str] = None
    xero_refresh_token: Optional[str] = None
    xero_token_expiry: Optional[datetime] = None
    google_vision_api_key: Optional[str] = None
    reconciliation_confidence_threshold: Optional[float] = None
    auto_reconcile: Optional[bool] = None
    email_enabled: Optional[bool] = None
    email_address: Optional[str] = None
    email_password: Optional[str] = None
    email_server: Optional[str] = None

class OrganizationSettingsInDB(OrganizationSettingsBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class OrganizationSettings(OrganizationSettingsInDB):
    # We exclude sensitive fields in responses
    class Config:
        orm_mode = True
        exclude = {"xero_client_secret", "xero_refresh_token", "email_password"}

# Invoice Schemas
class InvoiceBase(BaseModel):
    invoice_number: str
    vendor: str
    amount: float
    currency: str = "GBP"
    issue_date: datetime
    due_date: Optional[datetime] = None
    status: str = "pending"

class InvoiceCreate(InvoiceBase):
    organization_id: str
    cost_center: Optional[str] = None
    file_path: Optional[str] = None

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    cost_center: Optional[str] = None
    cost_center_manually_set: Optional[bool] = None

class OCRData(BaseModel):
    raw_text: str
    confidence: float
    extracted_data: Dict[str, Any]

class InvoiceInDB(InvoiceBase):
    id: str
    organization_id: str
    file_path: Optional[str] = None
    ocr_data: Optional[Dict[str, Any]] = None
    ocr_confidence: Optional[float] = None
    cost_center: Optional[str] = None
    cost_center_confidence: Optional[float] = None
    cost_center_manually_set: bool = False
    xero_invoice_id: Optional[str] = None
    xero_contact_id: Optional[str] = None
    xero_status: Optional[str] = None
    reconciled: bool = False
    reconciled_at: Optional[datetime] = None
    reconciled_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Invoice(InvoiceInDB):
    pass

# Cost Center Schemas
class CostCenterBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    active: bool = True

class CostCenterCreate(CostCenterBase):
    organization_id: str

class CostCenterUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None

class CostCenterInDB(CostCenterBase):
    id: str
    organization_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CostCenter(CostCenterInDB):
    pass

# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int 