import { configureStore } from '@reduxjs/toolkit';
import invoicesReducer from '../features/invoices/invoicesSlice';
import settingsReducer from '../features/settings/settingsSlice';
import xeroReducer from '../features/xero/xeroSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    invoices: invoicesReducer,
    settings: settingsReducer,
    xero: xeroReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 