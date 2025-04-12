import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'reconciled';
  issueDate: string;
  dueDate: string;
  description?: string;
  notes?: string;
  // Line items
  lineItems: Array<{
    _id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    costCenter: {
      code: string;
      name: string;
      confidence: number;
      predictedAt: string;
      manuallySet: boolean;
    };
    categorization: {
      category: string;
      subcategory: string;
      confidence: number;
      predictedAt: string;
      manuallySet: boolean;
      keywords: string[];
    };
  }>;
  // Cost center and categorization
  costCenter: {
    code: string;
    name: string;
    confidence: number;
    predictedAt: string;
    manuallySet: boolean;
  };
  categorization: {
    category: string;
    subcategory: string;
    confidence: number;
    predictedAt: string;
    manuallySet: boolean;
    keywords: string[];
  };
  file: {
    originalName: string;
    path?: string;
    mimeType: string;
    size: number;
  };
  ocrResults: {
    confidence: number;
    rawText: string;
    processedAt: string;
    extractedData: {
      detectedInvoiceNumber: string;
      detectedVendor: string;
      detectedAmount: number;
      detectedDate: string;
      confidence: {
        invoiceNumber: number;
        vendor: number;
        amount: number;
        date: number;
      };
    };
  };
  matchedTransactions?: Array<{
    id: string;
    reference: string;
    amount: number;
    date: string;
    confidence: number;
  }>;
  reconciliationDate?: string;
  xeroMatching: {
    matchedTransactionId?: string;
    confidence?: number;
    matchedAt?: string;
    status: 'pending' | 'matched' | 'no_match' | 'multiple_matches';
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginatedInvoices {
  data: Invoice[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InvoicesState {
  items: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: InvoicesState = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  status: 'idle',
  error: null,
};

export interface FetchInvoicesParams {
  page?: number;
  limit?: number;
  status?: string;
  vendor?: string;
  fromDate?: string;
  toDate?: string;
}

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (params?: FetchInvoicesParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.vendor) queryParams.append('vendor', params.vendor);
      if (params.fromDate) queryParams.append('fromDate', params.fromDate);
      if (params.toDate) queryParams.append('toDate', params.toDate);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/invoices${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  }
);

export const addInvoice = createAsyncThunk(
  'invoices/addInvoice',
  async (invoice: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/invoices', invoice);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async ({ id, invoice }: { id: string; invoice: Partial<Invoice> }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/invoices/${id}`, invoice);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update invoice');
    }
  }
);

export const reconcileInvoice = createAsyncThunk(
  'invoices/reconcileInvoice',
  async ({ 
    invoiceId, 
    transactionId, 
    updateCostCenter = true 
  }: { 
    invoiceId: string; 
    transactionId: string; 
    updateCostCenter?: boolean;
    reference?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/invoices/${invoiceId}/reconcile`, {
        transactionId,
        updateCostCenter
      });
      return response.data.invoice;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reconcile invoice');
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch invoices';
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(reconcileInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { resetStatus } = invoicesSlice.actions;
export default invoicesSlice.reducer; 