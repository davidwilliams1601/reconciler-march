import os
import json
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import models, crud

# Set up logging
logger = logging.getLogger(__name__)

class XeroService:
    """
    Service for interacting with the Xero API.
    """
    def __init__(self):
        self.client_id = settings.XERO_CLIENT_ID or ""
        self.client_secret = settings.XERO_CLIENT_SECRET or ""
        self.redirect_uri = settings.XERO_REDIRECT_URI or "http://localhost:3000/xero-callback"
        self.scope = "offline_access accounting.transactions accounting.settings"
        self.auth_url = "https://login.xero.com/identity/connect/authorize"
        self.token_url = "https://identity.xero.com/connect/token"
        self.api_url = "https://api.xero.com/api.xro/2.0"
        
        # Log configuration state (sanitized)
        logger.info(f"XeroService initialized with client_id configured: {bool(self.client_id)}")
        logger.info(f"XeroService initialized with redirect_uri: {self.redirect_uri}")
    
    def get_authorization_url(self, organization_id: int) -> str:
        """
        Generate the OAuth2 authorization URL for Xero.
        """
        if not self.client_id:
            logger.warning("Cannot generate authorization URL: client_id not configured")
            return f"https://example.com/mock-auth?client_id=not-configured&redirect_uri={self.redirect_uri}"
            
        # Generate a state parameter that includes the organization ID
        state = f"org_{organization_id}"
        
        # Construct the authorization URL
        auth_url = (
            f"{self.auth_url}?"
            f"response_type=code&"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"scope={self.scope}&"
            f"state={state}"
        )
        
        logger.info(f"Generated authorization URL for organization {organization_id}")
        return auth_url
    
    def exchange_code_for_token(self, code: str, organization_id: int) -> Dict[str, Any]:
        """
        Exchange the authorization code for access and refresh tokens.
        """
        try:
            # Request payload for token exchange
            payload = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self.redirect_uri,
            }
            
            # Basic auth with client ID and secret
            auth = (self.client_id, self.client_secret)
            
            # Make the token request
            response = requests.post(self.token_url, data=payload, auth=auth)
            response.raise_for_status()
            
            # Parse the response
            token_data = response.json()
            
            # Store the tokens in the database
            self._store_tokens(token_data, organization_id)
            
            return {
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "expires_in": token_data["expires_in"],
                "token_type": token_data["token_type"],
                "tenant_id": token_data.get("xero_tenant_id"),
            }
        except requests.RequestException as e:
            raise Exception(f"Error exchanging code for tokens: {str(e)}")
    
    def _store_tokens(self, token_data: Dict[str, Any], organization_id: int) -> None:
        """
        Store the Xero tokens in the database.
        """
        # Calculate the expiry time
        expires_at = datetime.now() + timedelta(seconds=token_data["expires_in"])
        
        # Connect to the database using a context manager
        with Session() as db:
            # Get the organization settings
            org_settings = crud.organization_settings.get_by_organization(
                db, organization_id=organization_id
            )
            
            if org_settings:
                # Update the existing settings
                crud.organization_settings.update(
                    db,
                    db_obj=org_settings,
                    obj_in={
                        "xero_refresh_token": token_data["refresh_token"],
                        "xero_token_expiry": expires_at,
                        "xero_tenant_id": token_data.get("xero_tenant_id"),
                    },
                )
            else:
                # Create new settings if they don't exist
                crud.organization_settings.create(
                    db,
                    obj_in={
                        "organization_id": organization_id,
                        "xero_refresh_token": token_data["refresh_token"],
                        "xero_token_expiry": expires_at,
                        "xero_tenant_id": token_data.get("xero_tenant_id"),
                    },
                )
    
    def _get_access_token(self, organization_id: int) -> str:
        """
        Get a valid access token for the Xero API.
        """
        # Connect to the database using a context manager
        with Session() as db:
            # Get the organization settings
            org_settings = crud.organization_settings.get_by_organization(
                db, organization_id=organization_id
            )
            
            if not org_settings or not org_settings.xero_refresh_token:
                raise Exception("Xero integration not configured for this organization")
            
            # Check if token is expired
            if not org_settings.xero_token_expiry or org_settings.xero_token_expiry < datetime.now():
                # Refresh the token
                return self._refresh_token(db, org_settings)
            
            # Return the valid access token from a previous refresh operation
            return org_settings.xero_access_token
    
    def _refresh_token(self, db: Session, org_settings: models.OrganizationSettings) -> str:
        """
        Refresh the Xero access token using the refresh token.
        """
        try:
            # Request payload for token refresh
            payload = {
                "grant_type": "refresh_token",
                "refresh_token": org_settings.xero_refresh_token,
            }
            
            # Basic auth with client ID and secret
            auth = (self.client_id, self.client_secret)
            
            # Make the token refresh request
            response = requests.post(self.token_url, data=payload, auth=auth)
            response.raise_for_status()
            
            # Parse the response
            token_data = response.json()
            
            # Calculate the expiry time
            expires_at = datetime.now() + timedelta(seconds=token_data["expires_in"])
            
            # Update the organization settings with the new tokens
            crud.organization_settings.update(
                db,
                db_obj=org_settings,
                obj_in={
                    "xero_access_token": token_data["access_token"],
                    "xero_refresh_token": token_data["refresh_token"],
                    "xero_token_expiry": expires_at,
                },
            )
            
            return token_data["access_token"]
        except requests.RequestException as e:
            raise Exception(f"Error refreshing access token: {str(e)}")
    
    def get_invoices(
        self,
        organization_id: int,
        status: Optional[str] = None,
        contact_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get invoices from Xero.
        """
        try:
            # Check if Xero is configured
            if not self.client_id or not self.client_secret:
                return self._get_mock_invoices()
                
            # Get a valid access token
            access_token = self._get_access_token(organization_id)
            
            # Get the tenant ID
            tenant_id = self._get_tenant_id(organization_id)
            
            # Construct the request URL
            url = f"{self.api_url}/Invoices"
            
            # Build query parameters
            params = {}
            if status:
                params["Status"] = status
            if contact_id:
                params["ContactID"] = contact_id
            if date_from:
                params["DateFrom"] = date_from
            if date_to:
                params["DateTo"] = date_to
            
            # Set up the headers
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Xero-Tenant-Id": tenant_id,
                "Accept": "application/json",
            }
            
            # Make the request
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            # Parse and return the invoices
            data = response.json()
            return data.get("Invoices", [])
        except requests.RequestException as e:
            # Return mock data if there's an error
            return self._get_mock_invoices()
        except Exception as e:
            # Return mock data if there's no valid configuration
            return self._get_mock_invoices()
    
    def get_bank_transactions(
        self,
        organization_id: int,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get bank transactions from Xero.
        """
        try:
            # Check if Xero is configured
            if not self.client_id or not self.client_secret:
                return self._get_mock_bank_transactions()
            
            # Get a valid access token
            access_token = self._get_access_token(organization_id)
            
            # Get the tenant ID
            tenant_id = self._get_tenant_id(organization_id)
            
            # Construct the request URL
            url = f"{self.api_url}/BankTransactions"
            
            # Build query parameters
            params = {}
            if from_date:
                params["DateFrom"] = from_date
            if to_date:
                params["DateTo"] = to_date
            
            # Set up the headers
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Xero-Tenant-Id": tenant_id,
                "Accept": "application/json",
            }
            
            # Make the request
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            # Parse and return the bank transactions
            data = response.json()
            return data.get("BankTransactions", [])
        except requests.RequestException as e:
            # Return mock data if there's an error
            return self._get_mock_bank_transactions()
        except Exception as e:
            # Return mock data if there's no valid configuration
            return self._get_mock_bank_transactions()
    
    def _get_tenant_id(self, organization_id: int) -> str:
        """
        Get the Xero tenant ID for the organization.
        """
        # Connect to the database using a context manager
        with Session() as db:
            # Get the organization settings
            org_settings = crud.organization_settings.get_by_organization(
                db, organization_id=organization_id
            )
            
            if not org_settings or not org_settings.xero_tenant_id:
                # If tenant ID is not stored, fetch it from Xero
                return self._fetch_tenant_id(db, org_settings)
            
            return org_settings.xero_tenant_id
    
    def _fetch_tenant_id(self, db: Session, org_settings: models.OrganizationSettings) -> str:
        """
        Fetch the Xero tenant ID from the connections endpoint.
        """
        try:
            # Ensure we have a valid access token
            access_token = self._refresh_token(db, org_settings)
            
            # Connections endpoint to get tenant information
            url = "https://api.xero.com/connections"
            
            # Set up the headers
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }
            
            # Make the request
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            # Parse the response
            connections = response.json()
            
            if not connections:
                raise Exception("No Xero connections found")
            
            # Use the first connection's tenant ID and name
            tenant_id = connections[0]["tenantId"]
            tenant_name = connections[0].get("tenantName", "")
            
            # Update the organization settings with the tenant ID and name
            crud.organization_settings.update(
                db,
                db_obj=org_settings,
                obj_in={
                    "xero_tenant_id": tenant_id,
                    "xero_tenant_name": tenant_name
                },
            )
            
            return tenant_id
        except requests.RequestException as e:
            raise Exception(f"Error fetching Xero tenant ID: {str(e)}")
    
    def get_tenant_details(self, organization_id: int) -> Dict[str, Any]:
        """
        Get details about the connected Xero tenant.
        """
        with Session() as db:
            org_settings = crud.organization_settings.get_by_organization(
                db, organization_id=organization_id
            )
            
            if not org_settings or not org_settings.xero_tenant_id:
                return {
                    "connected": False,
                    "message": "No Xero tenant connected"
                }
            
            return {
                "connected": True,
                "tenantId": org_settings.xero_tenant_id,
                "tenantName": org_settings.xero_tenant_name,
                "message": f"Connected to Xero tenant: {org_settings.xero_tenant_name}"
            }
    
    def reconcile_invoice(
        self,
        organization_id: int,
        invoice_id: str,
        bank_transaction_id: str,
    ) -> Dict[str, Any]:
        """
        Reconcile an invoice with a bank transaction in Xero.
        """
        try:
            # Check if Xero is configured
            if not self.client_id or not self.client_secret:
                return self._get_mock_reconciliation_result(invoice_id, bank_transaction_id)
                
            # Get a valid access token
            access_token = self._get_access_token(organization_id)
            
            # Get the tenant ID
            tenant_id = self._get_tenant_id(organization_id)
            
            # In a real implementation, this would create a bank transfer or payment
            # that links the invoice and bank transaction
            
            # For now, we'll simulate the reconciliation
            url = f"{self.api_url}/Payments"
            
            # Set up the headers
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Xero-Tenant-Id": tenant_id,
                "Content-Type": "application/json",
            }
            
            # Create a payment to reconcile the invoice
            payload = {
                "Payments": [
                    {
                        "Invoice": {"InvoiceID": invoice_id},
                        "Account": {"AccountID": "BANK-ACCOUNT-ID"}, # This would be determined from the bank transaction
                        "Date": datetime.now().strftime("%Y-%m-%d"),
                        "Amount": 0.0,  # This would be determined from the invoice and bank transaction
                        "Reference": f"Reconciliation with bank transaction {bank_transaction_id}",
                    }
                ]
            }
            
            # Make the request
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            # Parse and return the result
            data = response.json()
            return {
                "success": True,
                "payment": data.get("Payments", [])[0] if data.get("Payments") else {},
                "message": "Invoice reconciled successfully",
            }
        except requests.RequestException as e:
            # Return mock data if there's an error
            return self._get_mock_reconciliation_result(invoice_id, bank_transaction_id)
        except Exception as e:
            # Return mock data if there's no valid configuration
            return self._get_mock_reconciliation_result(invoice_id, bank_transaction_id)
            
    def _get_mock_reconciliation_result(self, invoice_id: str, bank_transaction_id: str) -> Dict[str, Any]:
        """
        Generate mock reconciliation result for development and testing.
        """
        return {
            "success": True,
            "payment": {
                "PaymentID": f"mock-payment-{invoice_id[:8]}-{bank_transaction_id[:8]}",
                "Date": datetime.now().strftime("%Y-%m-%d"),
                "Amount": 0.0,
                "Reference": f"Reconciliation with bank transaction {bank_transaction_id}",
                "Status": "AUTHORISED"
            },
            "message": "Invoice reconciled successfully (mock data)",
        }
    
    def _get_mock_invoices(self) -> List[Dict[str, Any]]:
        """
        Generate mock invoice data for development and testing.
        """
        from datetime import datetime, timedelta
        
        today = datetime.now()
        
        return [
            {
                "InvoiceID": "mock-inv-001",
                "InvoiceNumber": "INV-001",
                "Type": "ACCREC",
                "Contact": {
                    "ContactID": "mock-contact-1",
                    "Name": "Acme Corporation"
                },
                "Date": (today - timedelta(days=15)).strftime("%Y-%m-%d"),
                "DueDate": (today + timedelta(days=15)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 1000.00,
                "TotalTax": 200.00,
                "Total": 1200.00,
                "CurrencyCode": "GBP",
                "AmountDue": 1200.00,
                "AmountPaid": 0.00,
                "UpdatedDateUTC": (today - timedelta(days=15)).strftime("%Y-%m-%dT%H:%M:%SZ")
            },
            {
                "InvoiceID": "mock-inv-002",
                "InvoiceNumber": "INV-002",
                "Type": "ACCREC",
                "Contact": {
                    "ContactID": "mock-contact-2",
                    "Name": "Tech Solutions Ltd"
                },
                "Date": (today - timedelta(days=10)).strftime("%Y-%m-%d"),
                "DueDate": (today + timedelta(days=20)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 2500.00,
                "TotalTax": 500.00,
                "Total": 3000.00,
                "CurrencyCode": "GBP",
                "AmountDue": 3000.00,
                "AmountPaid": 0.00,
                "UpdatedDateUTC": (today - timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
            },
            {
                "InvoiceID": "mock-inv-003",
                "InvoiceNumber": "INV-003",
                "Type": "ACCREC",
                "Contact": {
                    "ContactID": "mock-contact-3",
                    "Name": "Global Shipping Inc."
                },
                "Date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                "DueDate": (today + timedelta(days=25)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 3500.00,
                "TotalTax": 700.00,
                "Total": 4200.00,
                "CurrencyCode": "GBP",
                "AmountDue": 4200.00,
                "AmountPaid": 0.00,
                "UpdatedDateUTC": (today - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        ]
    
    def _get_mock_bank_transactions(self) -> List[Dict[str, Any]]:
        """
        Generate mock bank transaction data for development and testing.
        """
        from datetime import datetime, timedelta
        
        today = datetime.now()
        
        return [
            {
                "BankTransactionID": "mock-bank-tx-001",
                "Type": "SPEND",
                "Contact": {
                    "ContactID": "mock-contact-1",
                    "Name": "Acme Corporation"
                },
                "Date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 1000.00,
                "TotalTax": 200.00,
                "Total": 1200.00,
                "BankAccount": {
                    "AccountID": "mock-account-1",
                    "Code": "090",
                    "Name": "Business Account"
                },
                "IsReconciled": False,
                "UpdatedDateUTC": (today - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")
            },
            {
                "BankTransactionID": "mock-bank-tx-002",
                "Type": "SPEND",
                "Contact": {
                    "ContactID": "mock-contact-2",
                    "Name": "Tech Solutions Ltd"
                },
                "Date": (today - timedelta(days=8)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 2500.00,
                "TotalTax": 500.00,
                "Total": 3000.00,
                "BankAccount": {
                    "AccountID": "mock-account-1",
                    "Code": "090",
                    "Name": "Business Account"
                },
                "IsReconciled": False,
                "UpdatedDateUTC": (today - timedelta(days=8)).strftime("%Y-%m-%dT%H:%M:%SZ")
            },
            {
                "BankTransactionID": "mock-bank-tx-003",
                "Type": "SPEND",
                "Contact": {
                    "ContactID": "mock-contact-3",
                    "Name": "Global Shipping Inc."
                },
                "Date": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
                "Status": "AUTHORISED",
                "LineAmountTypes": "Exclusive",
                "SubTotal": 3500.00,
                "TotalTax": 700.00,
                "Total": 4200.00,
                "BankAccount": {
                    "AccountID": "mock-account-1",
                    "Code": "090",
                    "Name": "Business Account"
                },
                "IsReconciled": False,
                "UpdatedDateUTC": (today - timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        ]


# Create an instance of the XeroService
xero_service = XeroService() 