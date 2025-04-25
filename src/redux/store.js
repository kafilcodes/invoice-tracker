import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import invoiceReducer from './slices/invoiceSlice';
import clientReducer from './slices/clientSlice';
import companyReducer from './slices/companySlice';
import uiReducer from './slices/uiSlice';
import profileReducer from './slices/profileSlice';
import settingsReducer from './slices/settingsSlice';
import themeReducer from './slices/themeSlice';
import usersReducer from './slices/usersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    invoices: invoiceReducer,
    settings: settingsReducer,
    profile: profileReducer,
    clients: clientReducer,
    company: companyReducer,
    ui: uiReducer,
    theme: themeReducer,
    users: usersReducer,
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