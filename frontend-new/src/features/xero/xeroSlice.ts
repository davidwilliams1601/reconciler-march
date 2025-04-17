import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import { RootState } from '../../app/store';

// Define a more comprehensive Xero state interface
export interface XeroState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  connected: boolean;
  authUrl: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tokenExpiry: string | null;
  error: string | null;
  loading: boolean;
  lastSync: string | null;
}

// Initial state
const initialState: XeroState = {
  status: 'idle',
  isAuthenticated: false,
  connected: false,
  authUrl: null,
  tenantId: null,
  tenantName: null,
  tokenExpiry: null,
  error: null,
  loading: false,
  lastSync: null,
};

// New async thunk for the connect to Xero action
export const connectToXero = createAsyncThunk(
  'xero/connect',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/xero/auth-url');
      if (response.data && response.data.url) {
        return { authorizationUrl: response.data.url };
      }
      return rejectWithValue('Failed to get Xero authorization URL');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to connect to Xero');
    }
  }
);

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
      
      // Check for setup needed flag
      if (response.data && response.data.setupNeeded) {
        console.log('Xero setup needed:', response.data.message);
        return rejectWithValue({
          message: response.data.message || 'Xero setup needed',
          setupNeeded: true
        });
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
      
      // Check if this is a setup needed error
      if (error.response?.data?.setupNeeded) {
        return rejectWithValue({
          message: error.response.data.message || 'Xero setup needed',
          setupNeeded: true
        });
      }
      
      // Check for unauthorized_client error (common with Xero)
      if (error.response?.data?.error === 'unauthorized_client') {
        return rejectWithValue({
          message: 'Your Xero app is not properly configured or the Client ID is invalid',
          setupNeeded: true
        });
      }
      
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
      // Connect to Xero
      .addCase(connectToXero.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectToXero.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(connectToXero.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to connect to Xero';
      })
    
      // Fetch Status
      .addCase(fetchXeroStatus.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchXeroStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated || false;
        state.connected = action.payload.isAuthenticated || false;
        state.tenantId = action.payload.tenantId || null;
        state.tenantName = action.payload.tenantName || null;
        state.tokenExpiry = action.payload.tokenExpiry || null;
        state.lastSync = action.payload.lastSync || null;
      })
      .addCase(fetchXeroStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch Xero status';
      })
      
      // Get Auth URL
      .addCase(getXeroAuthUrl.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(getXeroAuthUrl.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.authUrl = action.payload.url || null;
      })
      .addCase(getXeroAuthUrl.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload as string || 'Failed to get Xero auth URL';
      })
      
      // Disconnect
      .addCase(disconnectXero.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })
      .addCase(disconnectXero.fulfilled, (state) => {
        state.status = 'succeeded';
        state.loading = false;
        state.isAuthenticated = false;
        state.connected = false;
        state.tenantId = null;
        state.tenantName = null;
        state.tokenExpiry = null;
      })
      .addCase(disconnectXero.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.payload as string || 'Failed to disconnect from Xero';
      });
  },
});

// Define selector to get the Xero state
export const selectXero = (state: RootState) => state.xero;

export const { resetXeroStatus } = xeroSlice.actions;
export default xeroSlice.reducer; 