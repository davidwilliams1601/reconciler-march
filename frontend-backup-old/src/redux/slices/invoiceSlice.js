import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  invoices: [],
  loading: false,
  error: null,
  stats: {
    totalInvoices: 0,
    pendingReview: 0,
    totalValue: 0
  }
};

const invoiceSlice = createSlice({
  name: 'invoice',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    addInvoice: (state, action) => {
      state.invoices.push(action.payload);
    },
    updateInvoice: (state, action) => {
      const index = state.invoices.findIndex(invoice => invoice._id === action.payload._id);
      if (index !== -1) {
        state.invoices[index] = action.payload;
      }
    }
  }
});

export const { 
  setLoading, 
  setInvoices, 
  setError, 
  setStats, 
  addInvoice, 
  updateInvoice 
} = invoiceSlice.actions;

export default invoiceSlice.reducer; 