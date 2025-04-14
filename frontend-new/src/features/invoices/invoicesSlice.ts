import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { 
  invoiceService, 
  Invoice as BackendInvoice, 
  InvoiceFilterParams, 
  PaginatedResponse 
} from '../../services/invoiceService';

// Define the frontend invoice interface
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
  reconciled: boolean;
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

// Map frontend filter params to backend filter params
function mapFiltersToBackend(params: any): InvoiceFilterParams {
  const mappedParams: InvoiceFilterParams = {
    page: params.page,
    limit: params.limit,
  };

  if (params.status) mappedParams.status = params.status;
  if (params.vendor) mappedParams.vendor = params.vendor;
  if (params.fromDate) mappedParams.date_from = params.fromDate;
  if (params.toDate) mappedParams.date_to = params.toDate;
  if (params.invoiceNumber) mappedParams.invoice_number = params.invoiceNumber;
  if (params.costCenter) mappedParams.cost_center_code = params.costCenter;

  return mappedParams;
}

// Map backend invoice to frontend format
function mapBackendToFrontendInvoice(backendInvoice: BackendInvoice): Invoice {
  return {
    _id: backendInvoice.id,
    invoiceNumber: backendInvoice.invoice_number,
    vendor: backendInvoice.vendor,
    amount: backendInvoice.amount,
    currency: backendInvoice.currency,
    status: backendInvoice.status as any,
    issueDate: backendInvoice.issue_date,
    dueDate: backendInvoice.due_date || '',
    costCenter: backendInvoice.cost_center ? {
      code: backendInvoice.cost_center,
      name: backendInvoice.cost_center,
      confidence: backendInvoice.cost_center_confidence || 0,
      predictedAt: backendInvoice.created_at,
      manuallySet: backendInvoice.cost_center_manually_set,
    } : {} as any,
    categorization: {
      category: '',
      subcategory: '',
      confidence: 0,
      predictedAt: backendInvoice.created_at,
      manuallySet: false,
      keywords: []
    },
    lineItems: [],
    file: {
      originalName: backendInvoice.file_path?.split('/').pop() || 'unknown',
      mimeType: 'application/pdf',
      size: 0
    },
    ocrResults: backendInvoice.ocr_data || {
      confidence: 0,
      rawText: '',
      processedAt: '',
      extractedData: {
        detectedInvoiceNumber: '',
        detectedVendor: '',
        detectedAmount: 0,
        detectedDate: '',
        confidence: {
          invoiceNumber: 0,
          vendor: 0,
          amount: 0,
          date: 0
        }
      }
    },
    xeroMatching: {
      matchedTransactionId: backendInvoice.xero_invoice_id,
      status: backendInvoice.reconciled ? 'matched' : 'pending',
      matchedAt: backendInvoice.reconciled_at,
    },
    reconciled: Boolean(backendInvoice.reconciled),
    createdAt: backendInvoice.created_at,
    updatedAt: backendInvoice.updated_at
  };
}

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (params?: any) => {
    // Transform params to match backend expectations
    const backendParams = mapFiltersToBackend(params || {});
    const response = await invoiceService.getInvoices(backendParams);
    
    // Map response to match frontend expectations
    return {
      data: response.items.map(mapBackendToFrontendInvoice),
      page: response.page,
      limit: response.size,
      total: response.total,
      totalPages: response.pages
    };
  }
);

export const addInvoice = createAsyncThunk(
  'invoices/addInvoice',
  async (invoiceData: any, { rejectWithValue }) => {
    try {
      const invoice = await invoiceService.createInvoice({
        invoice_number: invoiceData.invoiceNumber,
        vendor: invoiceData.vendor,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        status: invoiceData.status,
        cost_center: invoiceData.costCenter?.code,
      });
      
      // Map to frontend format
      return mapBackendToFrontendInvoice(invoice);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to add invoice');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async ({ id, invoice }: { id: string; invoice: any }, { rejectWithValue }) => {
    try {
      const updatedInvoice = await invoiceService.updateInvoice(id, {
        invoice_number: invoice.invoiceNumber,
        vendor: invoice.vendor,
        amount: invoice.amount,
        currency: invoice.currency,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        status: invoice.status,
        cost_center: invoice.costCenter?.code,
        cost_center_manually_set: invoice.costCenter?.manuallySet,
      });
      
      // Map to frontend format
      return mapBackendToFrontendInvoice(updatedInvoice);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update invoice');
    }
  }
);

export const reconcileInvoice = createAsyncThunk(
  'invoices/reconcileInvoice',
  async ({ 
    invoiceId, 
    transactionId, 
  }: { 
    invoiceId: string; 
    transactionId: string; 
    updateCostCenter?: boolean;
    reference?: string;
  }, { rejectWithValue }) => {
    try {
      const updatedInvoice = await invoiceService.reconcileInvoice(invoiceId, transactionId);
      
      // Map to frontend format
      return mapBackendToFrontendInvoice(updatedInvoice);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to reconcile invoice');
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