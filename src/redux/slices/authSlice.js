import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../firebase/auth.js';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebase/config.js';

// Helper to persistently store user data
const storeUserData = (userData) => {
  if (userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  } else {
    localStorage.removeItem('user');
  }
};

// Get user from localStorage
const storedUser = localStorage.getItem('user') 
  ? JSON.parse(localStorage.getItem('user')) 
  : null;

const initialState = {
  isAuthenticated: !!storedUser,
  user: storedUser,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

// Add this helper function to properly serialize Firebase user objects
const serializeUser = (user) => {
  if (!user) return null;
  
  // Extract only serializable properties from the user object
  const serializedUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    createdAt: user.metadata?.creationTime,
    lastLoginAt: user.metadata?.lastSignInTime,
    // Include any additional user data from Realtime DB
    role: user.role,
    organization: user.organization,
    department: user.department,
    phone: user.phone
  };
  
  // Filter out undefined values
  return Object.fromEntries(
    Object.entries(serializedUser).filter(([_, value]) => value !== undefined)
  );
};

// Async thunks for auth operations
export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, organization, role }, { rejectWithValue }) => {
    // Validate required fields
    if (!name || !email || !password || !organization || !role) {
      return rejectWithValue({ message: 'All fields are required' });
    }
    
    const userData = { 
      name, 
      role: role || 'reviewer', // Use the role from form, fallback to reviewer if not provided
      organization: organization || 'Unknown Organization',
      department: 'General'
    };
    const response = await authService.registerWithEmailAndPassword(email, password, userData);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    
    // Serialize the user data to avoid non-serializable values
    return serializeUser(response.data);
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const response = await authService.signInWithEmail(email, password);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    
    // Serialize the user data to avoid non-serializable values
    return serializeUser(response.data);
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    const response = await authService.signInWithGoogle();
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    
    // Serialize the user data to avoid non-serializable values
    return serializeUser(response.data);
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const response = await authService.signOut();
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    return null;
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    const response = await authService.updateProfile(userData);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    
    // Get updated user data
    const currentUserResponse = await authService.getCurrentUser();
    if (!currentUserResponse.success) {
      return rejectWithValue(currentUserResponse.error);
    }
    
    // Serialize the user data to avoid non-serializable values
    return serializeUser(currentUserResponse.data);
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    const response = await authService.changePassword(currentPassword, newPassword);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    return null;
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    const response = await authService.resetPassword(email);
    if (!response.success) {
      return rejectWithValue(response.error);
    }
    return null;
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Add any additional synchronous reducers here
    clearError: (state) => {
      state.error = null;
    },
    // Add setUser for direct auth state updates
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      storeUserData(action.payload);
    },
    // Add reset action for clearing state
    reset: (state) => {
      state.status = 'idle';
      state.error = null;
      // Don't reset user data here to avoid auth state flicker
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        storeUserData(action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Registration failed' };
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        storeUserData(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Login failed' };
      })
      
      // Google Login
      .addCase(loginWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
        storeUserData(action.payload);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Google login failed' };
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.isAuthenticated = false;
        state.user = null;
        storeUserData(null);
      })
      .addCase(logout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Logout failed' };
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        storeUserData(action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Profile update failed' };
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Password change failed' };
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || { message: 'Password reset failed' };
      });
  }
});

// Setup Firebase Auth state listener
export const setupAuthListener = (store) => {
  const auth = getAuth(app);
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const userResponse = await authService.getCurrentUser();
      if (userResponse.success) {
        store.dispatch(setUser(userResponse.data));
      } else {
        // Fallback to basic user info if Firestore fetch fails
        store.dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      }
    } else {
      // User is signed out
      store.dispatch(setUser(null));
    }
  });
};

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export const { clearError, setUser, reset } = authSlice.actions;
export default authSlice.reducer; 