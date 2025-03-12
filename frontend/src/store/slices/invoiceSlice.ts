import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  issueDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
}

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async () => {
    const response = await api.get('/api/invoices');
    return response.data;
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (invoice: Omit<Invoice, 'id'>) => {
    const response = await api.post('/api/invoices', invoice);
    return response.data;
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async (invoice: Invoice) => {
    const response = await api.put(`/api/invoices/${invoice.id}`, invoice);
    return response.data;
  }
);

export const deleteInvoice = createAsyncThunk(
  'invoices/deleteInvoice',
  async (id: string) => {
    await api.delete(`/api/invoices/${id}`);
    return id;
  }
);

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch invoices
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action: PayloadAction<Invoice[]>) => {
        state.loading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch invoices';
      });

    // Create invoice
    builder
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.loading = false;
        state.invoices.push(action.payload);
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create invoice';
      });

    // Update invoice
    builder
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.loading = false;
        const index = state.invoices.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.invoices[index] = action.payload;
        }
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update invoice';
      });

    // Delete invoice
    builder
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.invoices = state.invoices.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete invoice';
      });
  },
});

export const { clearError } = invoiceSlice.actions;
export default invoiceSlice.reducer; 