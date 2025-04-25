import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { uploadFile } from '../../firebase/storage';

// Helper function to save organization to localStorage
const saveOrganizationToLocalStorage = (organization) => {
  try {
    localStorage.setItem('invoiceTrackerOrganization', JSON.stringify(organization));
    return true;
  } catch (error) {
    console.error('Failed to save organization to localStorage:', error);
    return false;
  }
};

// Helper function to load organization from localStorage
const getOrganizationFromLocalStorage = () => {
  try {
    const organization = localStorage.getItem('invoiceTrackerOrganization');
    return organization ? JSON.parse(organization) : null;
  } catch (error) {
    console.error('Failed to load organization from localStorage:', error);
    return null;
  }
};

// Default organization structure if none exists
const defaultOrganization = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  website: '',
  logo: null,
  taxId: '',
  vatNumber: '',
  registrationNumber: '',
  industry: '',
  description: '',
  established: null,
  numberOfEmployees: null,
  bankInfo: {
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    swiftCode: '',
    ibanCode: ''
  }
};

// Get organization details
export const getOrganizationDetails = createAsyncThunk(
  'organization/getOrganizationDetails',
  async (_, { rejectWithValue }) => {
    try {
      // Try to get organization from primary endpoint
      const response = await api.get('/organizations/details');
      
      // Save to localStorage for offline access
      saveOrganizationToLocalStorage(response.data);
      
      return response.data;
    } catch (primaryError) {
      console.error('Error fetching organization from primary endpoint:', primaryError);
      
      // If primary endpoint not found, try alternate endpoint
      if (primaryError.response?.status === 404) {
        try {
          console.warn('Organization details endpoint not found, trying alternate endpoint');
          
          // Try alternate endpoint - some APIs use a different structure
          const alternateResponse = await api.get('/organizations');
          
          if (alternateResponse.data && Array.isArray(alternateResponse.data) && alternateResponse.data.length > 0) {
            // If it returns an array, use the first organization
            const organizationData = alternateResponse.data[0];
            
            // Save to localStorage
            saveOrganizationToLocalStorage(organizationData);
            
            return organizationData;
          } else if (alternateResponse.data && !Array.isArray(alternateResponse.data)) {
            // If it returns a single object
            saveOrganizationToLocalStorage(alternateResponse.data);
            
            return alternateResponse.data;
          }
          
          throw new Error('No organization data found in response');
        } catch (alternateError) {
          console.error('Error fetching from alternate endpoint:', alternateError);
          
          // Try another common endpoint pattern
          try {
            console.warn('Alternate endpoint failed, trying organization settings endpoint');
            const settingsResponse = await api.get('/settings/organization');
            
            if (settingsResponse.data) {
              // Save to localStorage
              saveOrganizationToLocalStorage(settingsResponse.data);
              
              return settingsResponse.data;
            }
          } catch (settingsError) {
            console.error('Error fetching from settings endpoint:', settingsError);
          }
        }
      }
      
      // Try to load from localStorage as last resort
      const localOrganization = getOrganizationFromLocalStorage();
      
      if (localOrganization) {
        return { ...localOrganization, _localOnly: true };
      }
      
      // Return default structure if everything fails
      return { ...defaultOrganization, _localOnly: true };
    }
  }
);

// Update organization details
export const updateOrganizationDetails = createAsyncThunk(
  'organization/updateOrganizationDetails',
  async (organizationData, { getState, rejectWithValue }) => {
    try {
      // Try primary endpoint for updating organization details
      const response = await api.put('/organizations/details', organizationData);
      
      // Save to localStorage
      saveOrganizationToLocalStorage(response.data);
      
      return response.data;
    } catch (primaryError) {
      console.error('Error updating organization with primary endpoint:', primaryError);
      
      // If primary endpoint not found, try alternate endpoints
      if (primaryError.response?.status === 404) {
        try {
          console.warn('Organization update endpoint not found, trying alternate endpoint');
          
          // Try to get existing organization ID
          const currentOrg = getState().organization.data;
          const orgId = currentOrg?.id;
          
          if (orgId) {
            // Try updating with organization ID
            const alternateResponse = await api.put(`/organizations/${orgId}`, organizationData);
            
            // Save to localStorage
            saveOrganizationToLocalStorage(alternateResponse.data);
            
            return alternateResponse.data;
          } else {
            // If no ID, try creating a new organization
            console.warn('No organization ID found, trying to create new organization');
            const createResponse = await api.post('/organizations', organizationData);
            
            // Save to localStorage
            saveOrganizationToLocalStorage(createResponse.data);
            
            return createResponse.data;
          }
        } catch (alternateError) {
          console.error('Error with alternate update endpoint:', alternateError);
          
          // Try another common endpoint pattern
          try {
            console.warn('Alternate update endpoint failed, trying settings endpoint');
            const settingsResponse = await api.put('/settings/organization', organizationData);
            
            if (settingsResponse.data) {
              // Save to localStorage
              saveOrganizationToLocalStorage(settingsResponse.data);
              
              return settingsResponse.data;
            }
          } catch (settingsError) {
            console.error('Error updating via settings endpoint:', settingsError);
          }
        }
      }
      
      // Get current organization data to merge with updates
      const currentOrganization = getState().organization.data || 
                                getOrganizationFromLocalStorage() || 
                                defaultOrganization;
      
      // Merge current organization with updates
      const mergedData = {
        ...currentOrganization,
        ...organizationData
      };
      
      // Save to localStorage despite API error
      saveOrganizationToLocalStorage(mergedData);
      
      return {
        ...mergedData,
        _localOnly: true,
        _error: primaryError.response?.data?.message || 'Failed to update organization on server'
      };
    }
  }
);

// Upload organization logo
export const uploadOrganizationLogo = createAsyncThunk(
  'organization/uploadOrganizationLogo',
  async (fileData, { getState, rejectWithValue }) => {
    try {
      // Try specific organization logo endpoint
      const formData = new FormData();
      formData.append('logo', fileData);
      
      // Try to get the organization ID
      const currentState = getState();
      const orgId = currentState.organization?.data?.id;
      
      // Try specific endpoint with ID if available
      let response;
      if (orgId) {
        response = await api.post(`/organizations/${orgId}/logo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Try generic endpoint if no ID
        response = await api.post('/organizations/logo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      const logoUrl = response.data.logoUrl || response.data.logo || response.data.url;
      
      // Get current organization data to merge with new logo
      const currentOrganization = getState().organization.data;
      const updatedOrganization = {
        ...currentOrganization,
        logo: logoUrl
      };
      
      // Save to localStorage
      saveOrganizationToLocalStorage(updatedOrganization);
      
      return updatedOrganization;
    } catch (primaryError) {
      console.error('Error uploading organization logo with specific endpoint:', primaryError);
      
      // If specific logo endpoint doesn't exist, try general file upload
      if (primaryError.response?.status === 404) {
        try {
          console.warn('Organization logo endpoint not found, trying general file upload');
          
          // Use the uploadFile utility with Firebase or other storage
          const uploadResponse = await uploadFile(fileData, 'logos');
          
          if (uploadResponse && uploadResponse.url) {
            // Get current organization data
            const currentOrganization = getState().organization.data;
            
            // Create updated organization with new logo URL
            const updatedOrganization = {
              ...currentOrganization,
              logo: uploadResponse.url
            };
            
            // Try to update the organization details with the new logo URL
            try {
              // Try to get the organization ID
              const orgId = currentOrganization?.id;
              
              if (orgId) {
                await api.put(`/organizations/${orgId}`, { logo: uploadResponse.url });
              } else {
                await api.put('/organizations/details', { logo: uploadResponse.url });
              }
            } catch (updateError) {
              console.error('Failed to update organization with new logo URL:', updateError);
            }
            
            // Save to localStorage regardless of update success
            saveOrganizationToLocalStorage(updatedOrganization);
            
            return updatedOrganization;
          }
          
          throw new Error('File upload response did not include a URL');
        } catch (uploadError) {
          console.error('Failed to upload with general file upload:', uploadError);
          
          // Get current organization data
          const currentOrganization = getState().organization.data;
          
          // Save to localStorage with error flag
          saveOrganizationToLocalStorage(currentOrganization);
          
          return {
            ...currentOrganization,
            _localOnly: true,
            _error: 'Logo upload endpoints not available'
          };
        }
      }
      
      // For other errors, keep current data but flag the error
      const currentOrganization = getState().organization.data;
      
      return {
        ...currentOrganization,
        _localOnly: true,
        _error: primaryError.response?.data?.message || 'Failed to upload logo'
      };
    }
  }
);

// Initial state with localStorage fallback
const initialState = {
  data: getOrganizationFromLocalStorage() || defaultOrganization,
  isLoading: false,
  isSuccess: false,
  isError: false,
  isLocalOnly: getOrganizationFromLocalStorage() ? true : false,
  message: ''
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    resetOrganization: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    
    // Update organization locally (for development or when API unavailable)
    updateOrganizationLocal: (state, action) => {
      state.data = {
        ...state.data,
        ...action.payload
      };
      state.isSuccess = true;
      state.isLocalOnly = true;
      state.message = 'Organization updated locally';
      
      // Save to localStorage
      saveOrganizationToLocalStorage(state.data);
    }
  },
  extraReducers: (builder) => {
    builder
      // Get organization details
      .addCase(getOrganizationDetails.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getOrganizationDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
        
        // Check if this is local-only data
        if (action.payload && action.payload._localOnly) {
          state.isLocalOnly = true;
          state.message = 'Using locally saved organization data';
        } else {
          state.isLocalOnly = false;
          state.message = '';
        }
      })
      .addCase(getOrganizationDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch organization details';
      })
      
      // Update organization details
      .addCase(updateOrganizationDetails.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(updateOrganizationDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
        
        // Check if this was a local-only update
        if (action.payload && action.payload._localOnly) {
          state.isLocalOnly = true;
          state.message = action.payload._error || 'Organization updated locally only';
        } else {
          state.isLocalOnly = false;
          state.message = 'Organization updated successfully';
        }
      })
      .addCase(updateOrganizationDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to update organization details';
      })
      
      // Upload organization logo
      .addCase(uploadOrganizationLogo.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(uploadOrganizationLogo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.data = action.payload;
        
        // Check if this was a local-only update
        if (action.payload && action.payload._localOnly) {
          state.isLocalOnly = true;
          state.message = action.payload._error || 'Logo stored locally only';
        } else {
          state.isLocalOnly = false;
          state.message = 'Logo uploaded successfully';
        }
      })
      .addCase(uploadOrganizationLogo.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to upload logo';
      });
  }
});

export const { resetOrganization, updateOrganizationLocal } = organizationSlice.actions;
export default organizationSlice.reducer; 