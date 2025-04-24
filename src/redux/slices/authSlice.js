import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Get user from local storage
const user = JSON.parse(localStorage.getItem('user')) || null;
const token = localStorage.getItem('token');

// If token exists, set default auth header
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('Registration error:', error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      const response = await api.post('/auth/login', userData);
      
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid credentials';
      console.error('Login error:', error);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
});

// Get current user profile
export const getCurrentUser = createAsyncThunk(
  'auth/getProfile',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get user profile';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Sample user data for development
const sampleUser = {
  _id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
};

const initialState = {
  user: user,
  isAuthenticated: Boolean(user),
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    // For development, bypass actual auth
    mockLogin: (state) => {
      state.user = sampleUser;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      localStorage.setItem('user', JSON.stringify(sampleUser));
      localStorage.setItem('token', 'mock-token');
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        // Development fallback
        if (process.env.NODE_ENV === 'development' && !api.defaults.baseURL.includes('localhost')) {
          state.user = sampleUser;
          state.isAuthenticated = true;
          state.isSuccess = true;
          state.isError = false;
          localStorage.setItem('user', JSON.stringify(sampleUser));
          localStorage.setItem('token', 'mock-token');
        }
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        // Development fallback
        if (process.env.NODE_ENV === 'development' && !api.defaults.baseURL.includes('localhost')) {
          state.user = sampleUser;
          state.isAuthenticated = true;
          state.isSuccess = true;
          state.isError = false;
          localStorage.setItem('user', JSON.stringify(sampleUser));
          localStorage.setItem('token', 'mock-token');
        }
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isSuccess = false;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        // Development fallback - don't clear user here, might be just network related
      });
  },
});

export const { reset, mockLogin } = authSlice.actions;
export default authSlice.reducer; 