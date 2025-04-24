import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import invoiceReducer from './slices/invoiceSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    invoices: invoiceReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['invoices/getAll/fulfilled', 'invoices/getById/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.dueDate', 'payload.createdAt'],
        // Ignore these paths in the state
        ignoredPaths: [
          'invoices.invoices',
          'invoices.currentInvoice',
          'invoices.stats',
          'invoices.activity',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store; 