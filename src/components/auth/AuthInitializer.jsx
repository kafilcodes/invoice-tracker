import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setupAuthListener } from '../../redux/slices/authSlice';

/**
 * Component responsible for initializing Firebase auth state listener
 * This component doesn't render anything - it just sets up the auth observer
 */
const AuthInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('Setting up Firebase auth listener...');
    
    let unsubscribe;
    try {
      // Set up Firebase auth state listener
      unsubscribe = dispatch(setupAuthListener());
      console.log('Firebase auth listener initialized successfully');
    } catch (error) {
      console.error('Failed to set up Firebase auth listener:', error);
    }
    
    // Clean up listener on component unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        console.log('Cleaning up Firebase auth listener');
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error while unsubscribing from auth listener:', error);
        }
      }
    };
  }, [dispatch]);

  // This component doesn't render anything
  return null;
};

export default AuthInitializer; 