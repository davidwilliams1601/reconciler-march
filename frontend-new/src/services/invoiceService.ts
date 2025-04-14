import api from './api';

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_desc?: boolean;
  invoice_number?: string;
  vendor?: string;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  date_from?: string;
  date_to?: string;
  reconciled?: boolean;
  cost_center_code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  vendor: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date?: string;
  status: string;
  file_path?: string;
  ocr_data?: any;
  ocr_confidence?: number;
  cost_center?: string;
  cost_center_confidence?: number;
  cost_center_manually_set: boolean;
  xero_invoice_id?: string;
  xero_contact_id?: string;
  xero_status?: string;
  reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  invoice_number: string;
  vendor: string;
  amount: number;
  currency?: string;
  issue_date: string;
  due_date?: string;
  status?: string;
  cost_center?: string;
  file_path?: string;
}

export interface InvoiceUpdate {
  invoice_number?: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string;
  status?: string;
  cost_center?: string;
  cost_center_manually_set?: boolean;
}

export const invoiceService = {
  /**
   * Get invoices with filtering and pagination
   */
  async getInvoices(params?: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const response = await api.get<PaginatedResponse<Invoice>>(
      `/api/invoices?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get a single invoice by ID
   */
  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/api/invoices/${id}`);
    return response.data;
  },

  /**
   * Create a new invoice
   */
  async createInvoice(data: InvoiceCreate): Promise<Invoice> {
    const response = await api.post<Invoice>('/api/invoices', data);
    return response.data;
  },

  /**
   * Update an existing invoice
   */
  async updateInvoice(id: string, data: InvoiceUpdate): Promise<Invoice> {
    const response = await api.put<Invoice>(`/api/invoices/${id}`, data);
    return response.data;
  },

  /**
   * Delete an invoice
   */
  async deleteInvoice(id: string): Promise<Invoice> {
    const response = await api.delete<Invoice>(`/api/invoices/${id}`);
    return response.data;
  },

  /**
   * Reconcile an invoice
   */
  async reconcileInvoice(id: string, xero_invoice_id?: string): Promise<Invoice> {
    const formData = new FormData();
    if (xero_invoice_id) {
      formData.append('xero_invoice_id', xero_invoice_id);
    }
    
    const response = await api.post<Invoice>(
      `/api/invoices/${id}/reconcile`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Upload invoice file
   */
  async uploadInvoice(
    file: File, 
    data: {
      invoice_number: string;
      vendor: string;
      amount: number;
      currency?: string;
      issue_date: string;
      due_date?: string;
      cost_center?: string;
      notes?: string;
    }
  ): Promise<Invoice> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add other invoice data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    const response = await api.post<Invoice>(
      '/api/upload/invoice', 
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

export default invoiceService; 