import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  status: 'pending' | 'review' | 'approved' | 'rejected';
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
  xeroMatching: {
    matchedTransactionId?: string;
    confidence?: number;
    matchedAt?: string;
    status: 'pending' | 'matched' | 'no_match' | 'multiple_matches';
  };
  createdAt: string;
  updatedAt: string;
}

interface InvoicesState {
  items: Invoice[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: InvoicesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async () => {
    const response = await api.get('/invoices');
    return response.data;
  }
);

export const addInvoice = createAsyncThunk(
  'invoices/addInvoice',
  async (invoice: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await api.post('/invoices', invoice);
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
      const response = await api.put(`/invoices/${id}`, invoice);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update invoice');
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
        state.items = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch invoices';
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  }
});

export const { resetStatus } = invoicesSlice.actions;
export default invoicesSlice.reducer; 