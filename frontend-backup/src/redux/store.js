import { configureStore } from '@reduxjs/toolkit';
import invoiceReducer from './slices/invoiceSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';

const store = configureStore({
  reducer: {
    invoice: invoiceReducer,
    auth: authReducer,
    settings: settingsReducer,
  },
});

export default store; 