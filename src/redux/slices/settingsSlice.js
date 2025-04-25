import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Helper function to save settings to localStorage
const saveSettingsToLocalStorage = (settings) => {
  try {
    localStorage.setItem('invoiceTrackerSettings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
    return false;
  }
};

// Helper function to load settings from localStorage
const getSettingsFromLocalStorage = () => {
  try {
    const settings = localStorage.getItem('invoiceTrackerSettings');
    return settings ? JSON.parse(settings) : null;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return null;
  }
};

// Default settings if none exist
const defaultSettings = {
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    inApp: true
  },
  invoiceDefaults: {
    paymentTerms: 30,
    notes: '',
    taxRate: 0
  },
  pdfSettings: {
    fontSize: 10,
    fontFamily: 'Arial',
    logoPosition: 'top-right'
  }
};

// Get system settings
export const getSettings = createAsyncThunk(
  'settings/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      // Try primary endpoint
      const response = await api.get('/settings');
      
      // Save to localStorage for offline access
      saveSettingsToLocalStorage(response.data);
      
      return response.data;
    } catch (primaryError) {
      console.error('Error fetching settings from primary endpoint:', primaryError);
      
      // If primary endpoint not found, try alternate endpoints
      if (primaryError.response?.status === 404) {
        try {
          console.warn('Settings endpoint not found, trying alternate endpoint');
          
          // Try system settings endpoint
          const alternateResponse = await api.get('/system/settings');
          
          // Save to localStorage
          saveSettingsToLocalStorage(alternateResponse.data);
          
          return alternateResponse.data;
        } catch (alternateError) {
          console.error('Error fetching from alternate endpoint:', alternateError);
          
          // Try app settings
          try {
            console.warn('Alternate settings endpoint failed, trying app settings');
            const appSettingsResponse = await api.get('/app/settings');
            
            // Save to localStorage
            saveSettingsToLocalStorage(appSettingsResponse.data);
            
            return appSettingsResponse.data;
          } catch (appSettingsError) {
            console.error('Error fetching app settings:', appSettingsError);
          }
        }
      }
      
      // Try to load from localStorage as last resort
      const localSettings = getSettingsFromLocalStorage();
      
      if (localSettings) {
        return { ...localSettings, _localOnly: true };
      }
      
      // Return default structure if everything fails
      return { ...defaultSettings, _localOnly: true };
    }
  }
);

// Update system settings
export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settingsData, { getState, rejectWithValue }) => {
    try {
      // Try primary endpoint
      const response = await api.put('/settings', settingsData);
      
      // Save to localStorage
      saveSettingsToLocalStorage(response.data);
      
      return response.data;
    } catch (primaryError) {
      console.error('Error updating settings with primary endpoint:', primaryError);
      
      // If primary endpoint not found, try alternate endpoints
      if (primaryError.response?.status === 404) {
        try {
          console.warn('Settings update endpoint not found, trying alternate endpoint');
          
          // Try system settings endpoint
          const alternateResponse = await api.put('/system/settings', settingsData);
          
          // Save to localStorage
          saveSettingsToLocalStorage(alternateResponse.data);
          
          return alternateResponse.data;
        } catch (alternateError) {
          console.error('Error with alternate settings endpoint:', alternateError);
          
          // Try app settings
          try {
            console.warn('Alternate settings update failed, trying app settings');
            const appSettingsResponse = await api.put('/app/settings', settingsData);
            
            // Save to localStorage
            saveSettingsToLocalStorage(appSettingsResponse.data);
            
            return appSettingsResponse.data;
          } catch (appSettingsError) {
            console.error('Error updating app settings:', appSettingsError);
          }
        }
      }
      
      // Get current settings to merge with updates
      const currentSettings = getState().settings.data || 
                            getSettingsFromLocalStorage() || 
                            defaultSettings;
      
      // Merge current settings with updates
      const mergedData = {
        ...currentSettings,
        ...settingsData
      };
      
      // Save to localStorage despite API error
      saveSettingsToLocalStorage(mergedData);
      
      return {
        ...mergedData,
        _localOnly: true,
        _error: primaryError.response?.data?.message || 'Failed to update settings on server'
      };
    }
  }
);

// Initial state with localStorage fallback
const initialState = {
  data: getSettingsFromLocalStorage() || defaultSettings,
  isLoading: false,
  isSuccess: false,
  isError: false,
  isLocalOnly: getSettingsFromLocalStorage() ? true : false,
  message: ''
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    resetSettings: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    
    // Update settings locally (for development or when API unavailable)
    updateSettingsLocal: (state, action) => {
      state.data = {
        ...state.data,
        ...action.payload
      };
      state.isSuccess = true;
      state.isLocalOnly = true;
      state.message = 'Settings updated locally';
      
      // Save to localStorage
      saveSettingsToLocalStorage(state.data);
    },
    
    // Apply a theme directly
    setTheme: (state, action) => {
      state.data.theme = action.payload;
      
      // Save to localStorage
      saveSettingsToLocalStorage(state.data);
    }
  },
  extraReducers: (builder) => {
    builder
      // Get settings
      .addCase(getSettings.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
        
        // Check if this is local-only data
        if (action.payload && action.payload._localOnly) {
          state.isLocalOnly = true;
          state.message = 'Using locally saved settings';
        } else {
          state.isLocalOnly = false;
          state.message = '';
        }
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch settings';
      })
      
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
        
        // Check if this was a local-only update
        if (action.payload && action.payload._localOnly) {
          state.isLocalOnly = true;
          state.message = action.payload._error || 'Settings updated locally only';
        } else {
          state.isLocalOnly = false;
          state.message = 'Settings updated successfully';
        }
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to update settings';
      });
  }
});

export const { resetSettings, updateSettingsLocal, setTheme } = settingsSlice.actions;
export default settingsSlice.reducer; 