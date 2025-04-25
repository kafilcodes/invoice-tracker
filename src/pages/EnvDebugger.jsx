import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Stack, Alert } from '@mui/material';
import { resetAuthState, checkAuthState } from '../firebase/authReset';

const EnvDebugger = () => {
  const [envVars, setEnvVars] = useState({});
  const [firebaseConfig, setFirebaseConfig] = useState({});
  const [resetStatus, setResetStatus] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Get all environment variables that start with VITE_
    const viteEnv = Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_'))
      .reduce((obj, key) => {
        obj[key] = import.meta.env[key];
        return obj;
      }, {});
    
    setEnvVars(viteEnv);
    
    // Extract Firebase config
    setFirebaseConfig({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
    });
  }, []);

  const checkConfig = () => {
    console.log('Environment Mode:', import.meta.env.MODE);
    console.log('Firebase Config:', firebaseConfig);
    
    // Check for undefined values
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => value === undefined)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      alert(`Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      console.log('All Firebase config variables are defined');
      alert('All Firebase config variables are defined!');
    }
  };

  const handleResetAuth = async () => {
    setIsResetting(true);
    setResetStatus({
      type: 'info',
      message: 'Resetting authentication state...'
    });
    
    try {
      const result = await resetAuthState();
      
      if (result) {
        setResetStatus({
          type: 'success',
          message: 'Authentication state reset successfully. You may need to reload the page.'
        });
      } else {
        setResetStatus({
          type: 'error',
          message: 'Failed to reset authentication state.'
        });
      }
    } catch (error) {
      setResetStatus({
        type: 'error',
        message: `Error resetting auth: ${error.message}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCheckAuth = () => {
    const user = checkAuthState();
    if (user) {
      setResetStatus({
        type: 'info',
        message: `Currently logged in as: ${user.email}`
      });
    } else {
      setResetStatus({
        type: 'info',
        message: 'Not currently logged in'
      });
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto', my: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Environment Variables Debugger</Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={checkConfig}
          >
            Check Config
          </Button>
          
          <Button 
            variant="contained" 
            color="warning" 
            onClick={handleCheckAuth}
          >
            Check Auth State
          </Button>
          
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleResetAuth}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Auth State'}
          </Button>
        </Stack>
        
        {resetStatus && (
          <Alert severity={resetStatus.type} sx={{ mb: 3 }}>
            {resetStatus.message}
          </Alert>
        )}
        
        <Typography variant="h6">Environment: {import.meta.env.MODE}</Typography>
        
        <Typography variant="h6" sx={{ mt: 3 }}>Firebase Configuration</Typography>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px',
          overflowX: 'auto'
        }}>
          {JSON.stringify(firebaseConfig, null, 2)}
        </pre>
        
        <Typography variant="h6" sx={{ mt: 3 }}>All VITE_ Environment Variables</Typography>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px',
          overflowX: 'auto' 
        }}>
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default EnvDebugger; 