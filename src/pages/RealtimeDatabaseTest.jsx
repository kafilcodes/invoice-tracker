import { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, Stack, CircularProgress, Divider, Alert } from '@mui/material';
import { rtdb } from '../firebase/config';
import { ref, set, get, onValue, off } from 'firebase/database';
import databaseService, { usersDB, invoicesDB } from '../firebase/database';

const RealtimeDatabaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    
    const checkConnection = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setConnected(connected);
      console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
    });
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      off(connectedRef);
    };
  }, [unsubscribe]);

  // Run a complete test of the Realtime Database
  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);
    
    try {
      // Test 1: Write a test document
      const testId = `test_${Date.now()}`;
      const testData = {
        message: 'Test data',
        timestamp: new Date().toISOString()
      };
      
      console.log('Writing test data...');
      const writeResult = await databaseService.setData(`tests/${testId}`, testData);
      
      if (!writeResult.success) {
        throw new Error(`Write failed: ${writeResult.error?.message || 'Unknown error'}`);
      }
      
      // Test 2: Read the test document back
      console.log('Reading test data...');
      const readResult = await databaseService.getData(`tests/${testId}`);
      
      if (!readResult.success) {
        throw new Error(`Read failed: ${readResult.error?.message || 'Unknown error'}`);
      }
      
      // Test 3: Update the test document
      console.log('Updating test data...');
      const updateResult = await databaseService.updateData(`tests/${testId}`, {
        message: 'Updated test data'
      });
      
      if (!updateResult.success) {
        throw new Error(`Update failed: ${updateResult.error?.message || 'Unknown error'}`);
      }
      
      // Test 4: Get a collection
      console.log('Getting test collection...');
      const collectionResult = await databaseService.getCollection('tests');
      
      if (!collectionResult.success) {
        throw new Error(`Collection read failed: ${collectionResult.error?.message || 'Unknown error'}`);
      }
      
      // Test 5: Setting up realtime listener
      console.log('Setting up real-time listener...');
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      
      const unsub = databaseService.subscribeToData(`tests/${testId}`, (result) => {
        if (result.success) {
          setRealtimeData(result.data);
        } else {
          console.error('Realtime data error:', result.error);
        }
      });
      
      setUnsubscribe(() => unsub);
      
      // Set the test results
      setTestResults({
        writeTest: writeResult,
        readTest: readResult,
        updateTest: updateResult,
        collectionTest: {
          success: collectionResult.success,
          count: collectionResult.data?.length || 0
        },
        realtimeTest: {
          success: true,
          message: 'Realtime listener set up successfully'
        }
      });
      
    } catch (err) {
      console.error('Test failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Test a specific collection
  const testUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await usersDB.getAllUsers();
      
      alert(`Found ${result.success ? result.data.length : 0} users in the database.`);
      console.log('Users:', result.data);
      
    } catch (err) {
      setError(err.message || 'Failed to get users');
      console.error('Error getting users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Test invoices collection
  const testInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await invoicesDB.getAllInvoices();
      
      alert(`Found ${result.success ? result.data.length : 0} invoices in the database.`);
      console.log('Invoices:', result.data);
      
    } catch (err) {
      setError(err.message || 'Failed to get invoices');
      console.error('Error getting invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Realtime Database Test
        </Typography>
        
        <Alert 
          severity={connected ? 'success' : 'error'} 
          sx={{ mb: 3 }}
        >
          {connected ? 'Connected to Firebase Realtime Database' : 'Not connected to Firebase Realtime Database'}
        </Alert>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stack spacing={2} direction="row" sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={runTest}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Testing...' : 'Run Database Test'}
          </Button>
          
          <Button 
            variant="outlined"
            onClick={testUsers}
            disabled={loading}
          >
            Test Users
          </Button>
          
          <Button 
            variant="outlined"
            onClick={testInvoices}
            disabled={loading}
          >
            Test Invoices
          </Button>
        </Stack>
        
        {testResults && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Test Results:</Typography>
            
            <Stack spacing={2}>
              <Alert severity={testResults.writeTest.success ? 'success' : 'error'}>
                Write Test: {testResults.writeTest.success ? 'Success' : 'Failed'}
              </Alert>
              
              <Alert severity={testResults.readTest.success ? 'success' : 'error'}>
                Read Test: {testResults.readTest.success ? 'Success' : 'Failed'}
              </Alert>
              
              <Alert severity={testResults.updateTest.success ? 'success' : 'error'}>
                Update Test: {testResults.updateTest.success ? 'Success' : 'Failed'}
              </Alert>
              
              <Alert severity={testResults.collectionTest.success ? 'success' : 'error'}>
                Collection Test: {testResults.collectionTest.success ? `Success (${testResults.collectionTest.count} items)` : 'Failed'}
              </Alert>
              
              <Alert severity={testResults.realtimeTest.success ? 'success' : 'error'}>
                Realtime Test: {testResults.realtimeTest.message}
              </Alert>
            </Stack>
          </Box>
        )}
        
        {realtimeData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Realtime Data:</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <pre>{JSON.stringify(realtimeData, null, 2)}</pre>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RealtimeDatabaseTest; 