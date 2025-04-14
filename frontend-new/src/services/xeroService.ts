import api from './api';

export interface XeroAuthUrl {
  auth_url: string;
  message: string;
}

export interface XeroToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface XeroInvoice {
  id: string;
  invoiceNumber: string;
  contact: {
    name: string;
    id: string;
  };
  date: string;
  dueDate: string;
  status: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    accountCode: string;
  }>;
  total: number;
  currencyCode: string;
}

export interface XeroBankTransaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  isReconciled: boolean;
  bankAccount: {
    name: string;
    id: string;
  };
}

export interface XeroReconciliationResult {
  success: boolean;
  message: string;
  timestamp: string;
}

export const xeroService = {
  /**
   * Get Xero OAuth2 authorization URL
   */
  async getAuthUrl(): Promise<XeroAuthUrl> {
    const response = await api.get<XeroAuthUrl>('/api/xero/auth-url');
    return response.data;
  },

  /**
   * Exchange authorization code for token
   */
  async exchangeAuthCode(code: string): Promise<XeroToken> {
    // FormData for file upload style endpoint
    const formData = new FormData();
    formData.append('code', code);

    const response = await api.post<XeroToken>('/api/xero/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get invoices from Xero
   */
  async getInvoices(): Promise<XeroInvoice[]> {
    const response = await api.get<XeroInvoice[]>('/api/xero/invoices');
    return response.data;
  },

  /**
   * Get bank transactions from Xero
   */
  async getBankTransactions(params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<XeroBankTransaction[]> {
    // Build query params
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.from_date) queryParams.append('from_date', params.from_date);
      if (params.to_date) queryParams.append('to_date', params.to_date);
    }
    
    const response = await api.get<XeroBankTransaction[]>(
      `/api/xero/bank-transactions?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Reconcile an invoice with a bank transaction in Xero
   */
  async reconcileInvoice(
    invoiceId: string, 
    bankTransactionId: string
  ): Promise<XeroReconciliationResult> {
    // FormData for file upload style endpoint
    const formData = new FormData();
    formData.append('invoice_id', invoiceId);
    formData.append('bank_transaction_id', bankTransactionId);

    const response = await api.post<XeroReconciliationResult>(
      '/api/xero/reconcile',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};

export default xeroService; 