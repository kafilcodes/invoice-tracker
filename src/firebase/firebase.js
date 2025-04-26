import { rtdb, auth, storage, app } from './config';
import authService from './auth';
import realtimeDB from './realtimeDb';

// Export everything from a central location
export {
  rtdb,
  auth, 
  storage,
  app,
  authService,
  realtimeDB
};

// Re-export auth service functions for backward compatibility
export const {
  registerWithEmailAndPassword,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  updateProfile,
  resetPassword,
  changePassword,
  updateEmail,
  getCurrentUser,
  getUserById,
  getAllUsers,
  subscribeToAuthChanges,
  subscribeToUserChanges,
  sendEmailVerification
} = authService;

// Initialize Firebase auth state
export const initFirebase = () => {
  console.log('Firebase initialized from firebase.js');
  return authService.subscribeToAuthChanges(authState => {
    console.log('Auth state changed:', authState.loggedIn ? 'User logged in' : 'User logged out');
  });
};

export default {
  auth,
  rtdb,
  storage,
  authService,
  realtimeDB,
  initFirebase
}; 