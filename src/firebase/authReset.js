import { auth } from './config';
import { signOut } from 'firebase/auth';

/**
 * Utility to completely reset Firebase auth state including clearing local storage
 * This can help resolve token-related authentication issues
 */
export const resetAuthState = async () => {
  console.log('Resetting Firebase auth state...');
  
  try {
    // Sign out current user
    await signOut(auth);
    
    // Clear browser storage
    const clearBrowserStorage = () => {
      // Clear localStorage items related to Firebase
      const keysToRemove = [];
      
      // Find all Firebase related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('firebase:') || 
          key.includes('firebaseui:') ||
          key.includes('Auth') ||
          key.includes('user') ||
          key.includes('token')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove the identified items
      keysToRemove.forEach(key => {
        console.log(`Removing localStorage item: ${key}`);
        localStorage.removeItem(key);
      });
      
      // Clear IndexedDB Firebase instances
      const clearIndexedDB = async () => {
        const databases = ['firebaseLocalStorageDb', 'firebaseLocalStorage'];
        
        try {
          // Check if indexedDB is available
          if (!window.indexedDB) {
            console.log('IndexedDB not available in this browser');
            return;
          }
          
          // Try to delete known Firebase IndexedDB databases
          for (const dbName of databases) {
            try {
              await window.indexedDB.deleteDatabase(dbName);
              console.log(`Deleted IndexedDB database: ${dbName}`);
            } catch (dbError) {
              console.warn(`Failed to delete IndexedDB database ${dbName}:`, dbError);
            }
          }
        } catch (error) {
          console.warn('Error clearing IndexedDB:', error);
        }
      };
      
      // Execute IndexedDB clearing
      clearIndexedDB().catch(err => {
        console.error('Failed to clear IndexedDB:', err);
      });
    };
    
    // Execute browser storage clearing
    clearBrowserStorage();
    
    console.log('Firebase auth state reset complete');
    
    // Reload the page to ensure a clean state
    // Uncommenting this will cause a page reload
    // window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Error resetting Firebase auth state:', error);
    return false;
  }
};

/**
 * Simple function to check current auth state
 */
export const checkAuthState = () => {
  const currentUser = auth.currentUser;
  
  console.log('Current auth state:', currentUser ? 'Logged in' : 'Not logged in');
  if (currentUser) {
    console.log('User details:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL
    });
  }
  
  return currentUser;
};

export default { resetAuthState, checkAuthState }; 