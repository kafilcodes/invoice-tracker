import { auth, rtdb } from './config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { store } from '../redux/store';
import { setUser } from '../redux/slices/authSlice';

/**
 * Handle invalid auth tokens by signing the user out
 */
const handleInvalidAuthToken = async () => {
  console.warn('Detected invalid auth token, signing out user...');
  try {
    await signOut(auth);
    console.log('User signed out due to invalid token');
    store.dispatch(setUser(null));
  } catch (error) {
    console.error('Error signing out user:', error);
  }
};

/**
 * Initialize Firebase authentication and set up auth state listener
 */
const initializeFirebaseAuth = () => {
  console.log('Initializing Firebase authentication...');
  
  try {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User authenticated:', user.uid);
        
        try {
          // Get user profile from Realtime Database
          const userRef = ref(rtdb, `users/${user.uid}`);
          const userSnapshot = await get(userRef);
          
          let userData;
          const timestamp = new Date().toISOString();
          
          if (userSnapshot.exists()) {
            // Update existing user data
            userData = {
              uid: user.uid,
              ...userSnapshot.val(),
              isEmailVerified: user.emailVerified,
            };
            
            // Update the last login time
            await update(userRef, {
              lastLoginAt: timestamp
            });
            
            console.log('User data retrieved from Realtime Database');
          } else {
            // Create user document if it doesn't exist
            userData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              role: 'reviewer', // Default role
              isEmailVerified: user.emailVerified,
              createdAt: timestamp,
              updatedAt: timestamp,
              lastLoginAt: timestamp
            };
            
            await set(userRef, userData);
            console.log('Created new user document in Realtime Database with reviewer role');
          }
          
          // Dispatch the user data to Redux store
          store.dispatch(setUser(userData));
        } catch (error) {
          console.error('Error processing authenticated user:', error);
          
          // Check if this is an auth token error (400 Bad Request)
          if (error.code === 'auth/invalid-user-token' || 
              error.code === 'auth/user-token-expired' ||
              error.message?.includes('400') ||
              error.message?.includes('Bad Request')) {
            await handleInvalidAuthToken();
            return;
          }
          
          // Still provide basic auth data to Redux
          store.dispatch(setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            isEmailVerified: user.emailVerified,
            role: 'reviewer'
          }));
        }
      } else {
        console.log('No authenticated user');
        store.dispatch(setUser(null));
      }
    }, (error) => {
      // This is the error handler for the onAuthStateChanged function
      console.error('Auth state change error:', error);
      if (error.code === 'auth/invalid-user-token' || 
          error.code === 'auth/user-token-expired' ||
          error.message?.includes('400') ||
          error.message?.includes('Bad Request')) {
        handleInvalidAuthToken();
      }
    });
    
    console.log('Firebase auth state listener initialized successfully');
    return unsubscribe;
  } catch (error) {
    console.error('Failed to initialize Firebase auth state listener:', error);
    return () => {}; // Return empty function
  }
};

// Initialize Firebase auth immediately
const authUnsubscribe = initializeFirebaseAuth();

// Export for potential cleanup in the future
export { authUnsubscribe };

export default initializeFirebaseAuth; 