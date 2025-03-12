import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

interface Settings {
  invoiceDefaults: {
    defaultCurrency: string;
    defaultDueDays: number;
    defaultStatus: string;
  };
  notifications: {
    emailNotifications: boolean;
    dueDateReminders: boolean;
    statusChangeAlerts: boolean;
  };
  display: {
    dateFormat: string;
    itemsPerPage: number;
  };
}

interface SettingsState {
  settings: Settings;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    invoiceDefaults: {
      defaultCurrency: 'GBP',
      defaultDueDays: 30,
      defaultStatus: 'pending',
    },
    notifications: {
      emailNotifications: true,
      dueDateReminders: true,
      statusChangeAlerts: true,
    },
    display: {
      dateFormat: 'dd/MM/yyyy',
      itemsPerPage: 10,
    },
  },
  loading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async () => {
  const response = await api.get('/api/settings');
  return response.data;
});

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settings: Settings) => {
    const response = await api.put('/api/settings', settings);
    return response.data;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch settings
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<Settings>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      });

    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action: PayloadAction<Settings>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer; 