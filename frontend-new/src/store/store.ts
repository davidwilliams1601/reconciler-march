import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from '../features/settings/settingsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import invoicesReducer from '../features/invoices/invoicesSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    dashboard: dashboardReducer,
    invoices: invoicesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 