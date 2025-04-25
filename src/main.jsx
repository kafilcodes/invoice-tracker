import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import App from './App.jsx'
import './index.css'

// Initialize error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Check if it's a Firebase Auth error (400 Bad Request)
  if (event.error && 
      (event.error.message?.includes('400 (Bad Request)') || 
       event.error.message?.includes('Firebase') || 
       event.error.message?.includes('auth'))) {
    
    console.warn('Detected Firebase authentication error, will attempt to recover');
    
    // Try to clean up localStorage
    try {
      // Find Firebase-related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('firebase:') || 
          key.includes('token') ||
          key.includes('auth')
        )) {
          console.log(`Removing potentially corrupted token: ${key}`);
          localStorage.removeItem(key);
        }
      }
    } catch (storageErr) {
      console.error('Failed to clear localStorage:', storageErr);
    }
  }
});

// Track application initialization
console.log('Application initialization started');

// Import Firebase initialization module directly
// This will trigger the initialization
import './firebase/firebaseInit';

// Log environment and initialization status
console.log('Environment:', import.meta.env.MODE);
console.log('Firebase Auth Initialization complete');

// Create root element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Add a global recovery function
window.resetFirebase = () => {
  console.log('Attempting to reset Firebase state...');
  localStorage.clear();
  sessionStorage.clear();
  
  // Attempt to clear IndexedDB Firebase storage
  try {
    if (window.indexedDB) {
      ['firebaseLocalStorageDb', 'firebaseLocalStorage'].forEach((dbName) => {
        window.indexedDB.deleteDatabase(dbName);
        console.log(`Deleted IndexedDB database: ${dbName}`);
      });
    }
  } catch (dbError) {
    console.error('Failed to clear IndexedDB databases:', dbError);
  }
  
  console.log('Firebase state reset, reloading page...');
  window.location.reload();
};

// Render app
root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
