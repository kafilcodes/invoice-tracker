import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getUserProfile, 
  updateUserProfile 
} from '../../firebase/firestore';
import { auth } from '../../firebase/config';
import { uploadProfilePictureWithAPI } from '../../utils/crudOperations';

// Default profile structure if none exists
const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  avatar: null,
  company: '',
  position: '',
  role: 'reviewer'
};

// Get profile data
export const getProfile = createAsyncThunk(
  'profile/getProfile',
  async (_, thunkAPI) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const profileData = await getUserProfile(currentUser.uid);
      
      if (!profileData) {
        // Create default profile if it doesn't exist
        const defaultProfile = {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          phone: '',
          avatar: currentUser.photoURL || '',
          company: '',
          position: '',
          role: 'reviewer'
        };
        
        // Create the profile
        const newProfile = await updateUserProfile(currentUser.uid, defaultProfile);
        return newProfile;
      }
      
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Use local user data as fallback
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) return user;
      
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData, thunkAPI) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      
      // Add metadata to control document creation and field updates
      const updatePayload = {
        ...profileData,
        _createIfNotExists: true,
        _fieldsToUpdate: Object.keys(profileData)
      };
      
      // Update the profile in Firestore
      const updatedProfile = await updateUserProfile(currentUser.uid, updatePayload);
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      return thunkAPI.rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  'profile/updatePassword',
  async (passwordData, thunkAPI) => {
    try {
      // Password update is handled by authSlice, this is just to maintain compatibility
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password update error:', error);
      return thunkAPI.rejectWithValue(error.message || 'Failed to update password');
    }
  }
);

// Upload profile picture with Firebase Storage
export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadProfilePicture',
  async (data, thunkAPI) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      
      // If this is a file upload operation
      if (data.file) {
        const result = await uploadProfilePictureWithAPI(
          data.file, 
          currentUser.uid,
          data.onProgress
        );
        
        if (result.success) {
          // Update profile with new URL
          await updateUserProfile(currentUser.uid, { 
            avatar: result.fileUrl 
          });
          
          return { avatar: result.fileUrl };
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      }
      
      // If this is just a URL update
      if (data.avatar) {
        await updateUserProfile(currentUser.uid, { 
          avatar: data.avatar 
        });
        
        return { avatar: data.avatar };
      }
      
      throw new Error('No profile picture data provided');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return thunkAPI.rejectWithValue(error.message || 'Failed to upload profile picture');
    }
  }
);

const initialState = {
  profileData: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: ''
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfile: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    
    // Update profile locally (for development purposes)
    updateProfileLocal: (state, action) => {
      state.profileData = {
        ...state.profileData,
        ...action.payload
      };
      state.isSuccess = true;
      state.message = 'Profile updated locally';
    }
  },
  extraReducers: (builder) => {
    builder
      // Get profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profileData = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to fetch profile';
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profileData = { ...state.profileData, ...action.payload };
        state.message = 'Profile updated successfully';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to update profile';
      })
      
      // Upload profile picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.profileData = { 
          ...state.profileData, 
          avatar: action.payload.avatar 
        };
        state.message = 'Profile picture updated successfully';
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || 'Failed to upload profile picture';
      })
      
      // Update password
      .addCase(updatePassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Password updated successfully';
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to update password';
      });
  }
});

export const { resetProfile, updateProfileLocal } = profileSlice.actions;
export default profileSlice.reducer; 