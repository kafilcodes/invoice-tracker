import { createSlice } from '@reduxjs/toolkit';

// Get preferences from localStorage if available
const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme !== null) {
    return JSON.parse(savedTheme);
  }
  // Use system preference as default
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getSidebarState = () => {
  const savedState = localStorage.getItem('sidebarOpen');
  if (savedState !== null) {
    return JSON.parse(savedState);
  }
  // Default to open on larger screens
  return window.innerWidth > 768;
};

// Get saved settings from localStorage if available
const getSavedSettings = () => {
  const savedSettings = localStorage.getItem('systemSettings');
  if (savedSettings !== null) {
    return JSON.parse(savedSettings);
  }
  return null;
};

const initialState = {
  darkMode: getPreferredTheme(),
  sidebarOpen: getSidebarState(),
  drawerWidth: 240,
  mobileDrawerOpen: false,
  notifications: [],
  loading: {
    global: false,
    dashboard: false,
    invoices: false,
    users: false,
  },
  settings: getSavedSettings() || {
    general: {
      companyName: 'Acme Corporation',
      contactEmail: 'admin@example.com',
      defaultCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      language: 'en',
      timezone: 'UTC',
    },
    invoice: {
      autoGenerateNumbers: true,
      numberPrefix: 'INV-',
      defaultDueDays: 30,
      requireNotesForRejection: true,
      allowEditsAfterApproval: false,
      notifyOnStatusChange: true,
    },
    notification: {
      sendEmailNotifications: true,
      emailOnNewInvoice: true,
      emailOnApproval: true,
      emailOnRejection: true,
      emailOnAssignment: true,
      digestFrequency: 'daily',
    },
    storage: {
      storageBucket: 'invoice-tracker-962af.firebasestorage.app',
      fileSizeLimit: 5,
      allowedFileTypes: '.pdf,.jpg,.jpeg,.png',
      deleteFilesWithInvoice: true,
    }
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', JSON.stringify(state.darkMode));
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      localStorage.setItem('sidebarOpen', JSON.stringify(state.sidebarOpen));
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
      localStorage.setItem('sidebarOpen', JSON.stringify(state.sidebarOpen));
    },
    toggleMobileDrawer: (state) => {
      state.mobileDrawerOpen = !state.mobileDrawerOpen;
    },
    setMobileDrawerOpen: (state, action) => {
      state.mobileDrawerOpen = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      state.loading[key] = value;
    },
    updateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
      localStorage.setItem('systemSettings', JSON.stringify(state.settings));
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileDrawer,
  setMobileDrawerOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  updateSettings,
} = uiSlice.actions;

export default uiSlice.reducer; 