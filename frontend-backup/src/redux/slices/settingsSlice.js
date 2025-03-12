import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  apiKeys: {
    dext: '',
    vision: '',
    xero: ''
  },
  loading: false,
  error: null
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setApiKeys: (state, action) => {
      state.apiKeys = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateApiKey: (state, action) => {
      const { key, value } = action.payload;
      state.apiKeys[key] = value;
    }
  }
});

export const { setApiKeys, setLoading, setError, updateApiKey } = settingsSlice.actions;

export default settingsSlice.reducer; 