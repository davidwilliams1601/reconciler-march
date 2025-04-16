import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Define the shape of our Xero state
export interface XeroState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  authUrl: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tokenExpiry: string | null;
  error: string | null;
}

// Initial state
const initialState: XeroState = {
  status: 'idle',
  isAuthenticated: false,
  authUrl: null,
  tenantId: null,
  tenantName: null,
  tokenExpiry: null,
  error: null,
};

// Async thunks
export const fetchXeroStatus = createAsyncThunk(
  'xero/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/xero/status');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch Xero status');
    }
  }
);

export const getXeroAuthUrl = createAsyncThunk(
  'xero/getAuthUrl',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Making API request to /api/xero/auth-url');
      const response = await api.get('/api/xero/auth-url');
      console.log('Received response from auth-url endpoint:', response.data);
      
      // Check for demo mode flag
      if (response.data && response.data.isDemoMode) {
        console.log('Detected demo mode in response');
        return {
          url: response.data.url,
          isDemoMode: true
        };
      }
      
      // Handle normal case
      if (response.data && response.data.url) {
        return response.data;
      } else {
        console.error('Invalid response format from auth-url endpoint:', response.data);
        return rejectWithValue('Invalid response format from Xero auth endpoint');
      }
    } catch (error: any) {
      console.error('Error in getXeroAuthUrl:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to get Xero auth URL');
    }
  }
);

export const disconnectXero = createAsyncThunk(
  'xero/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/xero/disconnect');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to disconnect from Xero');
    }
  }
);

// Create the slice
const xeroSlice = createSlice({
  name: 'xero',
  initialState,
  reducers: {
    resetXeroStatus: (state) => {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Status
      .addCase(fetchXeroStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchXeroStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = action.payload.isAuthenticated || false;
        state.tenantId = action.payload.tenantId || null;
        state.tenantName = action.payload.tenantName || null;
        state.tokenExpiry = action.payload.tokenExpiry || null;
      })
      .addCase(fetchXeroStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to fetch Xero status';
      })
      
      // Get Auth URL
      .addCase(getXeroAuthUrl.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getXeroAuthUrl.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.authUrl = action.payload.url || null;
      })
      .addCase(getXeroAuthUrl.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to get Xero auth URL';
      })
      
      // Disconnect
      .addCase(disconnectXero.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(disconnectXero.fulfilled, (state) => {
        state.status = 'succeeded';
        state.isAuthenticated = false;
        state.tenantId = null;
        state.tenantName = null;
        state.tokenExpiry = null;
      })
      .addCase(disconnectXero.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to disconnect from Xero';
      });
  },
});

export const { resetXeroStatus } = xeroSlice.actions;
export default xeroSlice.reducer; 