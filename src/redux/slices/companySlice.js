import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Default company data
const defaultCompanyData = {
  name: 'Your Company',
  description: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  },
  contactInfo: {
    email: '',
    phone: '',
    website: '',
  },
  logo: '',
  gstNumber: '',
  panNumber: '',
  establishedYear: '',
  industry: '',
};

// Helper function to get user from state or localStorage
const getUserFromState = (getState) => {
  const { auth } = getState();
  return auth.user || JSON.parse(localStorage.getItem('user') || '{}');
};

// Thunk to fetch company info
export const getCompanyInfo = createAsyncThunk(
  'company/getCompanyInfo',
  async (_, { rejectWithValue, getState }) => {
    try {
      try {
        // First try the dedicated organization endpoint
        const response = await api.get('/organizations/details');
        return response.data;
      } catch (organizationError) {
        console.warn('Organization endpoint failed, falling back to user data:', organizationError);
        
        // Fallback: Get company info from the user's organization field
        const user = getUserFromState(getState);
        
        if (!user || !user._id) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        // Try to get user data which might include company info
        const userResponse = await api.get(`/users/${user._id}`);
        
        // Check if user has organization data
        if (userResponse.data && userResponse.data.organization) {
          return userResponse.data.organization;
        }
        
        // If no organization data, use default and save it to localStorage
        const defaultData = { ...defaultCompanyData };
        
        // Save default data to localStorage for persistence
        localStorage.setItem('companyInfo', JSON.stringify(defaultData));
        
        return defaultData;
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      
      // Last resort fallback: Return default company data from localStorage or create new
      try {
        const cachedData = localStorage.getItem('companyInfo');
        if (cachedData) {
          return JSON.parse(cachedData);
        }
        
        // Create new default data
        const defaultData = { ...defaultCompanyData };
        localStorage.setItem('companyInfo', JSON.stringify(defaultData));
        return defaultData;
      } catch (localStorageError) {
        console.error('LocalStorage access error:', localStorageError);
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company information');
    }
  }
);

// Thunk to update company info
export const updateCompanyInfo = createAsyncThunk(
  'company/updateCompanyInfo',
  async (companyData, { rejectWithValue, getState }) => {
    try {
      // Deep filter to remove empty fields from nested objects
      const filterEmptyFields = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            .map(([k, v]) => [k, typeof v === 'object' ? filterEmptyFields(v) : v])
        );
      };
      
      // Filter out empty fields, including in nested objects
      const filteredData = filterEmptyFields(companyData);
      
      // Only proceed if there's data to update
      if (Object.keys(filteredData).length === 0) {
        return rejectWithValue('No company data provided for update');
      }
      
      // Add metadata to indicate which fields were explicitly set
      const dataWithMetadata = {
        ...filteredData,
        _fieldsToUpdate: Object.keys(filteredData),
        _createIfNotExists: true
      };
      
      try {
        // First try the dedicated organization endpoint
        const response = await api.put('/organizations/details', dataWithMetadata);
        
        // Save to localStorage for offline access
        const updatedData = response.data;
        localStorage.setItem('companyInfo', JSON.stringify(updatedData));
        
        return updatedData;
      } catch (organizationError) {
        console.warn('Organization endpoint failed, falling back to user data:', organizationError);
        
        // Fallback: Store organization info in the user's data
        const user = getUserFromState(getState);
        
        if (!user || !user._id) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        // Create a payload to update just the organization field in the user document
        const userUpdatePayload = {
          organization: filteredData,
          _fieldsToUpdate: ['organization'],
          _createIfNotExists: true
        };
        
        // Update the user with the organization data
        const userResponse = await api.put(`/users/${user._id}`, userUpdatePayload);
        
        // Extract the organization data from the response
        const updatedOrgData = userResponse.data.organization || filteredData;
        
        // Save to localStorage
        localStorage.setItem('companyInfo', JSON.stringify(updatedOrgData));
        
        return updatedOrgData;
      }
    } catch (error) {
      console.error('Error updating company info:', error);
      
      // Store in localStorage anyway as a last resort
      try {
        localStorage.setItem('companyInfo', JSON.stringify(filteredData));
      } catch (localStorageError) {
        console.error('LocalStorage access error:', localStorageError);
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to update company information');
    }
  }
);

// Thunk to upload company logo
export const uploadCompanyLogo = createAsyncThunk(
  'company/uploadCompanyLogo',
  async (data, { rejectWithValue, getState }) => {
    try {
      // Ensure the logo field is explicitly set
      const logoData = {
        ...data,
        _fieldsToUpdate: ['logo'], // Metadata to indicate which field to update
        _createIfNotExists: true
      };
      
      try {
        // First try the dedicated organization logo endpoint
        const response = await api.post('/organizations/logo', logoData);
        
        // Save to localStorage
        if (response.data && response.data.logo) {
          const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
          companyInfo.logo = response.data.logo;
          localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
        }
        
        return response.data;
      } catch (logoError) {
        console.warn('Organization logo endpoint failed, falling back to user data:', logoError);
        
        // Fallback: Store logo in user's organization data
        const user = getUserFromState(getState);
        
        if (!user || !user._id) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        // Get current company data
        let companyInfo;
        try {
          companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
        } catch (parseError) {
          companyInfo = {};
        }
        
        // Create updated company data with new logo
        const updatedCompanyInfo = {
          ...companyInfo,
          logo: data.logo
        };
        
        // Create a payload to update just the organization.logo field
        const userUpdatePayload = {
          organization: updatedCompanyInfo,
          _fieldsToUpdate: ['organization'],
          _createIfNotExists: true
        };
        
        // Update the user with the new logo
        const userResponse = await api.put(`/users/${user._id}`, userUpdatePayload);
        
        // Save to localStorage
        localStorage.setItem('companyInfo', JSON.stringify(updatedCompanyInfo));
        
        return { logo: data.logo };
      }
    } catch (error) {
      console.error('Error uploading company logo:', error.response?.data || error.message);
      
      // Store in localStorage anyway
      try {
        const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}');
        companyInfo.logo = data.logo;
        localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      } catch (localStorageError) {
        console.error('LocalStorage access error:', localStorageError);
      }
      
      return rejectWithValue(error.response?.data?.message || 'Failed to upload company logo');
    }
  }
);

const initialState = {
  companyData: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get company info reducers
      .addCase(getCompanyInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCompanyInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.companyData = action.payload;
      })
      .addCase(getCompanyInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update company info reducers
      .addCase(updateCompanyInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCompanyInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.companyData = action.payload;
        state.message = 'Company information updated successfully';
      })
      .addCase(updateCompanyInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Upload company logo reducers
      .addCase(uploadCompanyLogo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadCompanyLogo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.companyData = {
          ...state.companyData,
          logo: action.payload.logo,
        };
        state.message = 'Company logo uploaded successfully';
      })
      .addCase(uploadCompanyLogo.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = companySlice.actions;
export default companySlice.reducer; 