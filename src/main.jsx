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
          localStorage.removeItem(key);
        }
      }
    } catch (storageErr) {
      console.error('Failed to clear localStorage:', storageErr);
    }
  }
});

// Import Firebase initialization module directly
// This will trigger the initialization
import './firebase/firebaseInit';

// Create root element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Add a global recovery function
window.resetFirebase = () => {
  localStorage.clear();
  sessionStorage.clear();
  
  // Attempt to clear IndexedDB Firebase storage
  try {
    if (window.indexedDB) {
      ['firebaseLocalStorageDb', 'firebaseLocalStorage'].forEach((dbName) => {
        window.indexedDB.deleteDatabase(dbName);
      });
    }
  } catch (dbError) {
    console.error('Failed to clear IndexedDB databases:', dbError);
  }
  
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
