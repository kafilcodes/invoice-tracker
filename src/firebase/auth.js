import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail as firebaseUpdateEmail
} from 'firebase/auth';
import { app, auth } from './config';
import realtimeDb from './realtimeDb';

/**
 * Handle auth errors and provide a standardized response
 */
const handleAuthError = (error) => {
  // Check for 400 Bad Request errors which often indicate token issues
  if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
    console.warn('Detected potential auth token error:', error);
    
    // Try to clear problematic token
    try {
      // Find Firebase-related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('firebase:') || 
          key.includes('token')
        )) {
          console.log(`Removing potentially corrupted token: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (storageErr) {
      console.error('Failed to clear localStorage:', storageErr);
    }
    
    // Return a clearer error message
    return {
      success: false,
      error: {
        code: 'auth/invalid-token',
        message: 'Your authentication session has expired. Please sign in again.'
      }
    };
  }
  
  // Handle other common Firebase auth errors
  const errorCode = error.code || 'auth/unknown-error';
  let errorMessage = error.message || 'An unknown error occurred';
  
  // Map common Firebase error codes to more user-friendly messages
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      errorMessage = 'Invalid email or password';
      break;
    case 'auth/email-already-in-use':
      errorMessage = 'This email is already registered';
      break;
    case 'auth/weak-password':
      errorMessage = 'Password should be at least 6 characters';
      break;
    case 'auth/invalid-email':
      errorMessage = 'Invalid email address';
      break;
    case 'auth/network-request-failed':
      errorMessage = 'Network error. Please check your internet connection';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Too many failed attempts. Please try again later';
      break;
    case 'auth/popup-closed-by-user':
      errorMessage = 'Sign-in popup was closed before completing the sign in';
      break;
    default:
      // For other errors, clean up the Firebase error message
      errorMessage = errorMessage.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim();
  }
  
  console.error(`Auth error (${errorCode}):`, errorMessage);
  
  return {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage
    }
  };
};

/**
 * Authentication service with Firebase
 */
class AuthService {
  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} userData - Additional user data (name, etc.)
   * @returns {Promise<object>} Result object with success status and data or error
   */
  async registerWithEmailAndPassword(email, password, userData = {}) {
    try {
      // Ensure userData is an object even if undefined was passed
      userData = userData || {};
      
      // Get organization ID
      const orgId = userData.organization;
      
      // Validate organization first for both roles
      if (orgId) {
        // For admin role, ensure organization doesn't already exist
        if (userData.role === 'admin') {
          // Check if organization already exists
          const orgCheck = await realtimeDb.getData(`organizations/${orgId}`);
          
          if (orgCheck.success && orgCheck.exists) {
            return {
              success: false,
              error: {
                code: 'org/already-exists',
                message: `Organization "${orgId}" already exists. Please choose a different name.`
              }
            };
          }
        }
        
        // For reviewer role, ensure organization does exist
        if (userData.role === 'reviewer') {
          // Check if organization exists
          const orgCheck = await realtimeDb.getData(`organizations/${orgId}`);
          
          if (!orgCheck.success || !orgCheck.exists) {
            return {
              success: false,
              error: {
                code: 'org/not-found',
                message: `Organization "${orgId}" doesn't exist. Please check the name or contact your administrator.`
              }
            };
          }
        }
      }
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with additional data
      await firebaseUpdateProfile(user, {
        displayName: userData.name || "",
        photoURL: userData.photoURL || ""
      });
      
      // Create user document in Realtime Database
      const timestamp = new Date().toISOString();
      const userDataResult = await realtimeDb.setData(`users/${user.uid}`, {
        uid: user.uid,
        email,
        displayName: userData.name || "",
        photoURL: userData.photoURL || "",
        phone: userData.phone || "",
        role: userData.role || "reviewer",
        organization: userData.organization || "",
        department: userData.department || "General",
        createdAt: timestamp,
        updatedAt: timestamp
      });
      
      if (!userDataResult.success) {
        console.error("Error saving user data:", userDataResult.error);
      }
      
      if (orgId) {
        // Handle different user roles
        if (userData.role === 'admin') {
          console.log(`Creating organization with original casing: ${orgId}`);
          
          // Create organization in 'organizations' collection
          const orgResult = await realtimeDb.setData(`organizations/${orgId}`, {
            name: userData.organization,
            createdBy: user.uid,
            createdAt: timestamp,
            updatedAt: timestamp,
            adminIds: [user.uid]
          });
          
          if (!orgResult.success) {
            console.error("Error creating organization:", orgResult.error);
          }
          
          // Create initial empty collections for organization data
          await realtimeDb.setData(`organizations/${orgId}/invoices`, {});
          await realtimeDb.setData(`organizations/${orgId}/activity`, {});
          await realtimeDb.setData(`organizations/${orgId}/members`, {
            [user.uid]: {
              uid: user.uid,
              role: 'admin',
              joinedAt: timestamp
            }
          });
        } else if (userData.role === 'reviewer') {
          // For reviewer users, add them to the organization's members collection
          console.log(`Adding reviewer user to organization: ${orgId}`);
          
          // We already verified organization exists above, now add the user
          await realtimeDb.setData(`organizations/${orgId}/members/${user.uid}`, {
            uid: user.uid,
            name: userData.name || "",
            email: email,
            role: 'reviewer',
            joinedAt: timestamp,
            department: userData.department || "General",
            active: true
          });
          
          console.log(`Successfully added reviewer to organization's members`);
        }
      }
      
      return {
        success: true,
        data: user,
        message: "User registered successfully"
      };
    } catch (error) {
      console.error("Error registering user:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Result object with success status and data or error
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get additional user data from Realtime Database
      const userDataResult = await realtimeDb.getData(`users/${user.uid}`);
      
      // Combine Auth user and Database data
      const userData = userDataResult.exists 
        ? { ...user, ...userDataResult.data }
        : user;
      
      // Update last login timestamp
      await realtimeDb.updateData(`users/${user.uid}`, {
        lastLoginAt: new Date().toISOString()
      });
      
      return {
        success: true,
        data: userData,
        message: "Sign in successful"
      };
    } catch (error) {
      console.error("Error signing in:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Sign in with Google
   * @returns {Promise<object>} Result object with success status and data or error
   */
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if user exists in Realtime Database
      const userDataResult = await realtimeDb.getData(`users/${user.uid}`);
      
      const timestamp = new Date().toISOString();
      
      if (!userDataResult.exists) {
        // Create new user document if first-time sign-in
        await realtimeDb.setData(`users/${user.uid}`, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "",
          photoURL: user.photoURL || "",
          phone: user.phoneNumber || "",
          address: "",
          role: "user",
          createdAt: timestamp,
          updatedAt: timestamp,
          lastLoginAt: timestamp
        });
      } else {
        // Update last login
        await realtimeDb.updateData(`users/${user.uid}`, {
          updatedAt: timestamp,
          lastLoginAt: timestamp
        });
      }
      
      // Get updated user data
      const updatedUserDataResult = await realtimeDb.getData(`users/${user.uid}`);
      const userData = updatedUserDataResult.exists 
        ? { ...user, ...updatedUserDataResult.data }
        : user;
      
      return {
        success: true,
        data: userData,
        message: "Google sign in successful"
      };
    } catch (error) {
      console.error("Error signing in with Google:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Sign out current user
   * @returns {Promise<object>} Result object with success status and message or error
   */
  async signOut() {
    try {
      await firebaseSignOut(auth);
      return {
        success: true,
        message: "Sign out successful"
      };
    } catch (error) {
      console.error("Error signing out:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Update user profile
   * @param {object} userData - User data to update
   * @returns {Promise<object>} Result object with success status and message or error
   */
  async updateProfile(userData = {}) {
    try {
      // Ensure userData is an object even if undefined was passed
      userData = userData || {};
      
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Update Firebase Auth profile (only display name and photo URL)
      if (userData.name || userData.photoURL) {
        await firebaseUpdateProfile(currentUser, {
          displayName: userData.name || currentUser.displayName,
          photoURL: userData.photoURL || currentUser.photoURL
        });
      }
      
      // Update Realtime Database document with all user data
      const timestamp = new Date().toISOString();
      const updateData = {
        ...userData,
        updatedAt: timestamp
      };
      
      // Remove any undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      const updateResult = await realtimeDb.updateData(`users/${currentUser.uid}`, updateData);
      
      if (!updateResult.success) {
        console.error("Error updating user data:", updateResult.error);
        throw new Error(updateResult.error);
      }
      
      return {
        success: true,
        message: "Profile updated successfully"
      };
    } catch (error) {
      console.error("Error updating profile:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Reset password by sending reset email
   * @param {string} email - User email
   * @returns {Promise<object>} Result object with success status and message or error
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      
      // Log password reset attempt
      const timestamp = new Date().toISOString();
      await realtimeDb.setData(`logs/password-resets/${Date.now()}`, {
        email,
        timestamp,
        success: true
      });
      
      return {
        success: true,
        message: "Password reset email sent successfully"
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<object>} Result object with success status and message or error
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      if (!currentUser.email) {
        throw new Error("User has no email associated with account");
      }
      
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Change password
      await updatePassword(currentUser, newPassword);
      
      // Log password change activity
      const timestamp = new Date().toISOString();
      await realtimeDb.setData(`logs/password-changes/${currentUser.uid}_${Date.now()}`, {
        userId: currentUser.uid,
        type: "password-change",
        timestamp,
        success: true
      });
      
      return {
        success: true,
        message: "Password changed successfully"
      };
    } catch (error) {
      console.error("Error changing password:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Get current authenticated user with Database data
   * @returns {Promise<object>} Result object with success status and user data or error
   */
  async getCurrentUser() {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return {
          success: false,
          error: {
            code: "no-user",
            message: "No authenticated user found"
          }
        };
      }
      
      // Get additional data from Realtime Database
      const userDataResult = await realtimeDb.getData(`users/${currentUser.uid}`);
      
      const userData = userDataResult.exists
        ? { ...currentUser, ...userDataResult.data }
        : currentUser;
        
      return {
        success: true,
        data: userData
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Update user email
   * @param {string} currentPassword - Current password for verification
   * @param {string} newEmail - New email address
   * @returns {Promise<object>} Result object with success status and message or error
   */
  async updateEmail(currentPassword, newEmail) {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
      
      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update email in Firebase Auth
      await firebaseUpdateEmail(currentUser, newEmail);
      
      // Update email in Realtime Database
      const timestamp = new Date().toISOString();
      await realtimeDb.updateData(`users/${currentUser.uid}`, {
        email: newEmail,
        updatedAt: timestamp
      });
      
      // Log email change
      await realtimeDb.setData(`logs/email-changes/${currentUser.uid}_${Date.now()}`, {
        userId: currentUser.uid,
        oldEmail: currentUser.email,
        newEmail,
        timestamp,
        success: true
      });
      
      return {
        success: true,
        message: "Email updated successfully"
      };
    } catch (error) {
      console.error("Error updating email:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Get user data by ID
   * @param {string} userId - User ID to fetch
   * @returns {Promise<object>} Result object with success status and data or error
   */
  async getUserById(userId) {
    try {
      // Get user data from Realtime Database
      const userDataResult = await realtimeDb.getData(`users/${userId}`);
      
      if (!userDataResult.exists) {
        return {
          success: false,
          error: {
            code: "user-not-found",
            message: "User not found"
          }
        };
      }
      
      return {
        success: true,
        data: userDataResult.data
      };
    } catch (error) {
      console.error(`Error getting user ${userId}:`, error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Get all users (admin only)
   * @param {object} options - Query options (limit, orderBy, etc.)
   * @returns {Promise<object>} Result object with success status and data or error
   */
  async getAllUsers(options = {}) {
    try {
      // Query users from Realtime Database
      const queryResult = await realtimeDb.queryData('users', options);
      
      return {
        success: true,
        data: queryResult.data || []
      };
    } catch (error) {
      console.error("Error getting all users:", error);
      return handleAuthError(error);
    }
  }
  
  /**
   * Subscribe to auth state changes
   * @param {function} callback - Function to call when auth state changes
   * @returns {function} Unsubscribe function
   */
  subscribeToAuthChanges(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, get additional data
        const userDataResult = await realtimeDb.getData(`users/${user.uid}`);
        
        const userData = userDataResult.exists
          ? { ...user, ...userDataResult.data }
          : user;
          
        callback({
          loggedIn: true,
          user: userData
        });
      } else {
        // User is signed out
        callback({
          loggedIn: false,
          user: null
        });
      }
    });
  }
  
  /**
   * Subscribe to user data changes
   * @param {string} userId - User ID to subscribe to
   * @param {function} callback - Function to call when user data changes
   * @returns {function} Unsubscribe function
   */
  subscribeToUserChanges(userId, callback) {
    return realtimeDb.subscribeToData(`users/${userId}`, (snapshot) => {
      callback(snapshot.data);
    });
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Backwards compatibility functions
export const registerWithEmailAndPassword = (email, password, userData) => 
  authService.registerWithEmailAndPassword(email, password, userData);

export const signInWithEmail = (email, password) => 
  authService.signInWithEmail(email, password);

export const signInWithGoogle = () => 
  authService.signInWithGoogle();

export const signOut = () => 
  authService.signOut();

export const updateProfile = (userData) => 
  authService.updateProfile(userData);

export const resetPassword = (email) => 
  authService.resetPassword(email);

export const changePassword = (currentPassword, newPassword) => 
  authService.changePassword(currentPassword, newPassword);

export const updateEmail = (currentPassword, newEmail) => 
  authService.updateEmail(currentPassword, newEmail);

export const getCurrentUser = () => 
  authService.getCurrentUser();

export const getUserById = (userId) => 
  authService.getUserById(userId);

export const getAllUsers = (options) => 
  authService.getAllUsers(options);

export const subscribeToAuthChanges = (callback) => 
  authService.subscribeToAuthChanges(callback);

export const subscribeToUserChanges = (userId, callback) => 
  authService.subscribeToUserChanges(userId, callback); 