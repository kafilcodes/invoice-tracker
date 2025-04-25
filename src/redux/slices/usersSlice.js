import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import realtimeDb from '../../firebase/realtimeDatabase';

// Async thunk to fetch users by organization
export const fetchUsersByOrganization = createAsyncThunk(
  'users/fetchByOrganization',
  async (organizationId, { rejectWithValue }) => {
    try {
      if (!organizationId) {
        return rejectWithValue('No organization ID provided');
      }
      
      // Fetch users from Firebase Realtime Database
      const result = await realtimeDb.getData(`organizations/${organizationId}/users`);
      
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to fetch users');
      }
      
      // Convert object to array with IDs
      const usersArray = result.data 
        ? Object.entries(result.data).map(([id, userData]) => ({
            _id: id,
            ...userData
          }))
        : [];
      
      return usersArray;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null
  },
  reducers: {
    clearUsers: (state) => {
      state.users = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersByOrganization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByOrganization.fulfilled, (state, action) => {
        state.users = action.payload;
        state.loading = false;
      })
      .addCase(fetchUsersByOrganization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch users';
      });
  }
});

export const { clearUsers } = usersSlice.actions;

export default usersSlice.reducer; 