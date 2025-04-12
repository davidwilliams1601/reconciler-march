import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Define the settings interface
export interface Settings {
  // Xero API Configuration
  xeroClientId: string;
  xeroClientSecret: string;
  xeroTenantId: string;
  xeroRedirectUri: string;
  
  // Dext API Configuration
  dextApiKey: string;
  dextClientId: string;
  dextClientSecret: string;
  dextEnvironment: string;
  dextWebhookUrl: string;
  dextWebhookSecret: string;
  
  // Google Vision API Configuration
  googleVisionApiKey: string;
  googleVisionProjectId: string;
  googleVisionKeyFilePath: string;
  googleVisionConfidenceThreshold: number;
  
  // Reconciliation Settings
  autoReconcileEnabled: boolean;
  reconciliationConfidenceThreshold: number;
  reconciliationDateRange: number;
  reconciliationAccountCodes: string;
}

interface SettingsState {
  settings: Settings | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  testResults: {
    xero: boolean;
    dext: boolean;
    googleVision: boolean;
  };
}

const initialState: SettingsState = {
  settings: null,
  status: 'idle',
  error: null,
  testResults: {
    xero: false,
    dext: false,
    googleVision: false,
  },
};

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const response = await api.get('/settings');
    return response.data;
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Settings) => {
    const response = await api.post('/settings', settings);
    return response.data;
  }
);

// Test connection thunks
export const testXeroConnection = createAsyncThunk(
  'settings/testXeroConnection',
  async (credentials: { clientId: string; clientSecret: string; tenantId: string }) => {
    const response = await api.post('/settings/test-xero', credentials);
    return response.data;
  }
);

export const testDextConnection = createAsyncThunk(
  'settings/testDextConnection',
  async (credentials: { apiKey?: string; clientId?: string; clientSecret?: string }) => {
    // If any credentials are missing, return successful but disabled status
    if (!credentials.apiKey || !credentials.clientId || !credentials.clientSecret) {
      return {
        success: true,
        authenticated: false,
        message: 'Dext integration is optional and has been disabled'
      };
    }
    
    const response = await api.post('/settings/test-dext', credentials);
    return response.data;
  }
);

export const testGoogleVisionConnection = createAsyncThunk(
  'settings/testGoogleVisionConnection',
  async (credentials: { apiKey: string; projectId: string }) => {
    const response = await api.post('/settings/test-google-vision', credentials);
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch settings';
      })
      // Save settings
      .addCase(saveSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to save settings';
      })
      // Test Xero Connection
      .addCase(testXeroConnection.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(testXeroConnection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.testResults = { ...state.testResults, xero: action.payload };
      })
      .addCase(testXeroConnection.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to test Xero connection';
      })
      // Test Dext Connection
      .addCase(testDextConnection.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(testDextConnection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.testResults = { ...state.testResults, dext: action.payload };
      })
      .addCase(testDextConnection.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to test Dext connection';
      })
      // Test Google Vision Connection
      .addCase(testGoogleVisionConnection.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(testGoogleVisionConnection.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.testResults = { ...state.testResults, googleVision: action.payload };
      })
      .addCase(testGoogleVisionConnection.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to test Google Vision connection';
      });
  },
});

export default settingsSlice.reducer; 