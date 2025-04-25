import { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, Stack, CircularProgress } from '@mui/material';
import { resetAuthState } from '../firebase/authReset';
import { useNavigate } from 'react-router-dom';

const FirebaseRecovery = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  
  const handleResetAuth = async () => {
    setIsResetting(true);
    setResult({ type: 'info', message: 'Resetting authentication state...' });
    
    try {
      await resetAuthState();
      setResult({ 
        type: 'success', 
        message: 'Authentication state has been reset. Redirecting to login...'
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (error) {
      setResult({
        type: 'error',
        message: `Failed to reset authentication: ${error.message}`
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  const handleFullReset = () => {
    // This is more drastic - completely clear all localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Try to clear IndexedDB Firebase storage
    try {
      if (window.indexedDB) {
        ['firebaseLocalStorageDb', 'firebaseLocalStorage'].forEach((dbName) => {
          window.indexedDB.deleteDatabase(dbName);
        });
      }
    } catch (error) {
      console.error('Failed to clear IndexedDB databases:', error);
    }
    
    setResult({ 
      type: 'success', 
      message: 'Application state has been completely reset. Reloading the page...'
    });
    
    // Reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: '600px', mx: 'auto', my: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="error">
          Firebase Authentication Issue
        </Typography>
        
        <Typography variant="body1" paragraph>
          It appears you're experiencing an issue with Firebase authentication. This is often caused by corrupt authentication tokens or expired credentials.
        </Typography>
        
        <Typography variant="body1" paragraph>
          You can try resetting your authentication state to resolve this issue.
        </Typography>
        
        {result && (
          <Alert severity={result.type} sx={{ mb: 3 }}>
            {result.message}
          </Alert>
        )}
        
        <Stack spacing={2} direction="column">
          <Button
            variant="contained"
            color="primary"
            disabled={isResetting}
            onClick={handleResetAuth}
            startIcon={isResetting ? <CircularProgress size={20} /> : null}
            fullWidth
          >
            {isResetting ? 'Resetting...' : 'Reset Authentication State'}
          </Button>
          
          <Typography variant="body2" align="center" sx={{ my: 1 }}>
            - or -
          </Typography>
          
          <Button
            variant="outlined"
            color="error"
            onClick={handleFullReset}
            fullWidth
          >
            Complete Application Reset
          </Button>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            If problems persist after resetting, please contact support or try clearing your browser cache.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default FirebaseRecovery; 