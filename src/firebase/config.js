import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Get environment variables with fallbacks
const getEnvVar = (key, defaultValue = undefined) => {
  if (import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

// Check for missing environment variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MEASUREMENT_ID',
  'VITE_FIREBASE_DATABASE_URL',
];

// Hardcoded Firebase config as a fallback
const hardcodedConfig = {
  apiKey: "AIzaSyDIewviYB8J3lrR5fKJXh0ttCIC3LQWQTw",
  authDomain: "invoice-tracker-962af.firebaseapp.com",
  databaseURL: "https://invoice-tracker-962af-default-rtdb.firebaseio.com",
  projectId: "invoice-tracker-962af",
  storageBucket: "invoice-tracker-962af.firebasestorage.app",
  messagingSenderId: "398281139624",
  appId: "1:398281139624:web:abe2ad2bc6fd258fc9299d",
  measurementId: "G-T29QNK1Q07"
};

// Set the config source first to the env variables
const envConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
};

// Check if any env variables are missing
const missingVars = Object.entries(envConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

// Determine whether to use environment variables or hardcoded config
const useHardcoded = missingVars.length > 0;
const configSource = useHardcoded ? 'hardcoded' : 'environment';

console.log(`Using ${configSource} Firebase configuration`);

// Firebase configuration - use environment variables if available, otherwise fallback to hardcoded
const firebaseConfig = useHardcoded ? hardcodedConfig : envConfig;

// Ensure database URL is set - this is critical for Realtime Database
if (!firebaseConfig.databaseURL) {
  console.error('Firebase databaseURL is missing! Realtime Database will not work.');
  firebaseConfig.databaseURL = "https://invoice-tracker-962af-default-rtdb.firebaseio.com";
}

// Initialize variables outside the try block
let app, auth, storage, rtdb;

// Initialize Firebase
try {
  console.log('Initializing Firebase with config:', Object.keys(firebaseConfig).reduce((acc, key) => {
    acc[key] = key === 'apiKey' ? '[HIDDEN]' : Boolean(firebaseConfig[key]) ? 'Set' : 'Missing';
    return acc;
  }, {}));
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  rtdb = getDatabase(app);
  storage = getStorage(app);

  console.log('Firebase initialized successfully');
  console.log(`Realtime Database URL: ${rtdb.app.options.databaseURL}`);
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // Create placeholder exports to prevent crashes
  app = { name: 'failed-initialization' };
  auth = { currentUser: null, onAuthStateChanged: () => () => {} };
  rtdb = {};
  storage = {};
  
  // Don't throw error here to allow app to continue loading
  console.warn('Using mock Firebase objects due to initialization failure');
}

// Export all variables outside the try/catch
export { auth, rtdb, storage, app }; 