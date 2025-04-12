import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

class XeroService:
    """
    Service for integrating with Xero accounting software.
    """
    def __init__(self):
        self.client_id = os.environ.get("XERO_CLIENT_ID")
        self.client_secret = os.environ.get("XERO_CLIENT_SECRET")
    
    def is_configured(self) -> bool:
        """Check if the Xero service is configured with API credentials."""
        return bool(self.client_id and self.client_secret)
    
    def authenticate(self, refresh_token: str = None) -> Dict[str, Any]:
        """
        Get an OAuth2 token for the Xero API.
        
        Args:
            refresh_token: Optional refresh token to use for authentication
            
        Returns:
            Dictionary with the authentication result
        """
        if not self.is_configured():
            return self._mock_auth_response()
        
        # In a real implementation, this would use the Xero API
        # For now, we'll return mock data
        return self._mock_auth_response()
    
    def get_invoices(self, token: str, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Get invoices from Xero.
        
        Args:
            token: Xero API token
            tenant_id: Xero tenant ID
            
        Returns:
            List of invoices
        """
        if not self.is_configured():
            return self._mock_invoices()
        
        # In a real implementation, this would use the Xero API
        # For now, we'll return mock data
        return self._mock_invoices()
    
    def get_bank_transactions(
        self, 
        token: str, 
        tenant_id: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get bank transactions from Xero.
        
        Args:
            token: Xero API token
            tenant_id: Xero tenant ID
            from_date: Optional filter for transactions from this date
            to_date: Optional filter for transactions to this date
            
        Returns:
            List of bank transactions
        """
        if not self.is_configured():
            return self._mock_bank_transactions()
        
        # In a real implementation, this would use the Xero API
        # For now, we'll return mock data
        return self._mock_bank_transactions()
    
    def reconcile_invoice(
        self, 
        token: str, 
        tenant_id: str,
        invoice_id: str,
        bank_transaction_id: str
    ) -> Dict[str, Any]:
        """
        Reconcile an invoice with a bank transaction in Xero.
        
        Args:
            token: Xero API token
            tenant_id: Xero tenant ID
            invoice_id: Xero invoice ID
            bank_transaction_id: Xero bank transaction ID
            
        Returns:
            Dictionary with the reconciliation result
        """
        if not self.is_configured():
            return self._mock_reconciliation_result()
        
        # In a real implementation, this would use the Xero API
        # For now, we'll return mock data
        return self._mock_reconciliation_result()
    
    def _mock_auth_response(self) -> Dict[str, Any]:
        """Provide a mock authentication response."""
        now = datetime.now()
        expires_at = now + timedelta(hours=1)
        
        return {
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token",
            "expires_at": expires_at.timestamp(),
            "token_type": "Bearer",
        }
    
    def _mock_invoices(self) -> List[Dict[str, Any]]:
        """Provide mock invoices for development and testing."""
        return [
            {
                "id": "xero-inv-001",
                "invoiceNumber": "INV-001",
                "contact": {
                    "name": "Acme Inc",
                    "id": "xero-contact-001"
                },
                "date": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                "dueDate": (datetime.now() - timedelta(days=15)).strftime('%Y-%m-%d'),
                "status": "AUTHORISED",
                "lineItems": [
                    {
                        "description": "Office Supplies",
                        "quantity": 1,
                        "unitAmount": 1250.99,
                        "accountCode": "EXP-001"
                    }
                ],
                "total": 1250.99,
                "currencyCode": "GBP"
            },
            {
                "id": "xero-inv-002",
                "invoiceNumber": "INV-002",
                "contact": {
                    "name": "Tech Solutions Ltd",
                    "id": "xero-contact-002"
                },
                "date": (datetime.now() - timedelta(days=25)).strftime('%Y-%m-%d'),
                "dueDate": (datetime.now() - timedelta(days=10)).strftime('%Y-%m-%d'),
                "status": "AUTHORISED",
                "lineItems": [
                    {
                        "description": "Software License",
                        "quantity": 1,
                        "unitAmount": 3499.50,
                        "accountCode": "EXP-002"
                    }
                ],
                "total": 3499.50,
                "currencyCode": "GBP"
            },
        ]
    
    def _mock_bank_transactions(self) -> List[Dict[str, Any]]:
        """Provide mock bank transactions for development and testing."""
        return [
            {
                "id": "xero-bank-001",
                "date": (datetime.now() - timedelta(days=20)).strftime('%Y-%m-%d'),
                "amount": 1250.99,
                "reference": "INV-001",
                "isReconciled": False,
                "bankAccount": {
                    "name": "Business Account",
                    "id": "xero-account-001"
                }
            },
            {
                "id": "xero-bank-002",
                "date": (datetime.now() - timedelta(days=15)).strftime('%Y-%m-%d'),
                "amount": 3499.50,
                "reference": "INV-002",
                "isReconciled": False,
                "bankAccount": {
                    "name": "Business Account",
                    "id": "xero-account-001"
                }
            },
        ]
    
    def _mock_reconciliation_result(self) -> Dict[str, Any]:
        """Provide a mock reconciliation result."""
        return {
            "success": True,
            "message": "Invoice successfully reconciled in Xero",
            "timestamp": datetime.now().isoformat()
        }

# Create singleton instance
xero_service = XeroService() 