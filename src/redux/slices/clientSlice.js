import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import clientService from '../../services/ClientService';

// Initial state
const initialState = {
  clients: [],
  currentClient: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Async thunks for client operations

/**
 * Fetch all clients for the current user
 */
export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (options = {}, { rejectWithValue }) => {
    try {
      // Get current user ID from local storage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.uid) {
        return rejectWithValue({ message: 'User not authenticated' });
      }

      const response = await clientService.getUserClients(userData.uid, options);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to fetch clients'
      });
    }
  }
);

/**
 * Fetch a single client by ID
 */
export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await clientService.getClientById(clientId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to fetch client'
      });
    }
  }
);

/**
 * Create a new client
 */
export const createClient = createAsyncThunk(
  'clients/create',
  async (clientData, { rejectWithValue }) => {
    try {
      // Get current user ID from local storage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.uid) {
        return rejectWithValue({ message: 'User not authenticated' });
      }

      // Add user ID to client data
      const clientWithUserId = {
        ...clientData,
        userId: userData.uid
      };

      const response = await clientService.createClient(clientWithUserId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to create client'
      });
    }
  }
);

/**
 * Update an existing client
 */
export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ clientId, updateData }, { rejectWithValue }) => {
    try {
      const response = await clientService.updateClient(clientId, updateData);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to update client'
      });
    }
  }
);

/**
 * Delete a client
 */
export const deleteClient = createAsyncThunk(
  'clients/delete',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await clientService.deleteClient(clientId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return clientId;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to delete client'
      });
    }
  }
);

/**
 * Set a client's active status
 */
export const setClientActiveStatus = createAsyncThunk(
  'clients/setActiveStatus',
  async ({ clientId, isActive }, { rejectWithValue }) => {
    try {
      const response = await clientService.setClientActiveStatus(clientId, isActive);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to update client status'
      });
    }
  }
);

/**
 * Search clients
 */
export const searchClients = createAsyncThunk(
  'clients/search',
  async ({ searchTerm, options = {} }, { rejectWithValue }) => {
    try {
      // Get current user ID from local storage
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.uid) {
        return rejectWithValue({ message: 'User not authenticated' });
      }

      const response = await clientService.searchClients(userData.uid, searchTerm, options);
      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to search clients'
      });
    }
  }
);

// Client slice
const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    // Set the current client
    setCurrentClient: (state, action) => {
      state.currentClient = action.payload;
    },
    // Clear the current client
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    // Clear any errors
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = action.payload;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Fetch client by ID
      .addCase(fetchClientById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Create client
      .addCase(createClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients.push(action.payload);
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update client
      .addCase(updateClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update in the clients array
        const index = state.clients.findIndex(
          client => client.id === action.payload.id
        );
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        // Update current client if it's the same one
        if (state.currentClient && state.currentClient.id === action.payload.id) {
          state.currentClient = action.payload;
        }
        state.error = null;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Delete client
      .addCase(deleteClient.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Remove from the clients array
        state.clients = state.clients.filter(
          client => client.id !== action.payload
        );
        // Clear current client if it's the same one
        if (state.currentClient && state.currentClient.id === action.payload) {
          state.currentClient = null;
        }
        state.error = null;
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Set client active status
      .addCase(setClientActiveStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setClientActiveStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Update in the clients array
        const index = state.clients.findIndex(
          client => client.id === action.payload.id
        );
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        // Update current client if it's the same one
        if (state.currentClient && state.currentClient.id === action.payload.id) {
          state.currentClient = action.payload;
        }
        state.error = null;
      })
      .addCase(setClientActiveStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Search clients
      .addCase(searchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clients = action.payload;
        state.error = null;
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// Export actions and reducer
export const { setCurrentClient, clearCurrentClient, clearError } = clientSlice.actions;
export default clientSlice.reducer; 