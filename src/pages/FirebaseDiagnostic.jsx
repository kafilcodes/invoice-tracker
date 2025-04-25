import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudIcon from '@mui/icons-material/Cloud';
import HelpIcon from '@mui/icons-material/Help';
import { auth, rtdb } from '../firebase/config';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { ref, get, child } from 'firebase/database';

const FirebaseDiagnostic = () => {
  const [connectionStatus, setConnectionStatus] = useState({ 
    status: 'unknown',
    lastChecked: null,
    error: null,
    errorCode: null
  });
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [collections, setCollections] = useState([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Try connecting to Realtime Database instead
      const dbRef = ref(rtdb);
      await get(child(dbRef, '.info/connected'));
      
      setConnectionStatus({
        status: 'connected',
        lastChecked: new Date().toISOString(),
        error: null,
        errorCode: null
      });
      setIsOnline(true);
    } catch (error) {
      setConnectionStatus({
        status: 'error',
        lastChecked: new Date().toISOString(),
        error: error.message,
        errorCode: error.code
      });
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  // No more toggle network (was Firestore-specific)
  const handleToggleNetwork = async () => {
    setError("Network toggling is only available for Firestore. This app now uses Firebase Realtime Database exclusively.");
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticResults(null);
    
    try {
      // Simple diagnostics for RTDB
      const results = {
        timestamp: new Date().toISOString(),
        rtdb: null,
        auth: null,
        paths: null
      };
      
      // Check RTDB
      try {
        const dbRef = ref(rtdb);
        await get(child(dbRef, '.info/connected'));
        results.rtdb = { success: true };
      } catch (err) {
        results.rtdb = { 
          success: false, 
          error: err.message,
          code: err.code
        };
      }
      
      // Check auth status
      const currentUser = auth.currentUser;
      results.auth = {
        success: !!currentUser,
        currentUser: currentUser ? {
          uid: currentUser.uid,
          isAnonymous: currentUser.isAnonymous,
          email: currentUser.email,
          displayName: currentUser.displayName
        } : null
      };
      
      // Check common paths
      const commonPaths = ['/users', '/organizations', '/invoices'];
      const pathResults = [];
      
      for (const path of commonPaths) {
        try {
          const snapshot = await get(child(dbRef, path));
          pathResults.push({
            path,
            exists: snapshot.exists(),
            childCount: snapshot.exists() ? Object.keys(snapshot.val()).length : 0,
            error: null
          });
        } catch (err) {
          pathResults.push({
            path,
            exists: false,
            childCount: 0,
            error: err.message
          });
        }
      }
      
      results.paths = {
        success: pathResults.some(p => p.exists),
        paths: pathResults
      };
      
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setDiagnosticResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleTestAuth = async () => {
    try {
      const auth = getAuth();
      const result = await signInAnonymously(auth);
      if (result.user) {
        alert(`Successfully signed in anonymously: ${result.user.uid}`);
      }
    } catch (error) {
      alert(`Authentication error: ${error.message} (${error.code})`);
    }
  };

  const handleListCollections = async () => {
    setIsLoadingCollections(true);
    setError(null);
    
    try {
      // For RTDB, we'll check top-level paths instead of collections
      const commonPaths = ['users', 'organizations', 'invoices', 'activity_logs'];
      const collectionsData = [];
      const dbRef = ref(rtdb);
      
      for (const path of commonPaths) {
        try {
          const snapshot = await get(child(dbRef, path));
          
          collectionsData.push({
            name: path,
            exists: snapshot.exists(),
            childCount: snapshot.exists() ? Object.keys(snapshot.val() || {}).length : 0
          });
        } catch (err) {
          collectionsData.push({
            name: path,
            exists: false,
            error: err.message
          });
        }
      }
      
      setCollections(collectionsData);
    } catch (err) {
      setError(`Failed to list paths: ${err.message}`);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'error';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box 
      sx={{
        p: 3,
        maxWidth: '800px',
        mx: 'auto',
        my: 4
      }}
    >
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Firebase Diagnostic Center
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>RTDB Mode</AlertTitle>
          This app now uses Firebase Realtime Database exclusively. All Firestore functionality has been removed.
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics}
            startIcon={isRunningDiagnostics ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {isRunningDiagnostics ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleTestAuth}
            disabled={isChecking}
          >
            Test Auth
          </Button>
          
          <Button
            variant="outlined"
            onClick={handleListCollections}
            disabled={isLoadingCollections}
            startIcon={isLoadingCollections ? <CircularProgress size={20} /> : null}
          >
            Check Paths
          </Button>
          
          <Button
            variant="outlined"
            onClick={checkConnection}
            disabled={isChecking}
            startIcon={isChecking ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            Check Connection
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {connectionStatus.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {connectionStatus.error}
          {connectionStatus.errorCode && <div>Code: {connectionStatus.errorCode}</div>}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Connection Status" 
              subheader={`Last checked: ${formatTime(connectionStatus.lastChecked)}`}
              action={
                <IconButton onClick={checkConnection} disabled={isChecking}>
                  {isChecking ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip 
                  label={connectionStatus.status} 
                  color={getStatusColor(connectionStatus.status)}
                  icon={connectionStatus.status === 'connected' ? <CloudIcon /> : <CloudOffIcon />}
                  sx={{ mr: 2 }}
                />
                <Typography>
                  {connectionStatus.status === 'connected' 
                    ? 'Successfully connected to Firebase Realtime Database!' 
                    : 'Could not connect to Firebase Realtime Database.'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Authentication Status: {isSignedIn ? 'Signed In' : 'Not Signed In'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Database Paths" />
            <CardContent>
              {isLoadingCollections ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : collections.length > 0 ? (
                <List dense>
                  {collections.map((col, index) => (
                    <React.Fragment key={col.name}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemText 
                          primary={col.name} 
                          secondary={
                            col.error 
                              ? `Error: ${col.error}` 
                              : col.exists 
                                ? `${col.childCount} entries`
                                : 'Path does not exist or not accessible'
                          }
                        />
                        <Chip 
                          label={col.exists ? 'Exists' : 'No Access'} 
                          color={col.exists ? 'success' : 'warning'} 
                          size="small"
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No paths checked yet. Click "Check Paths" to start.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {diagnosticResults && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Diagnostic Results
            <Typography variant="caption" sx={{ ml: 2 }}>
              {formatTime(diagnosticResults.timestamp)}
            </Typography>
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">RTDB Status</Typography>
            <Chip 
              label={diagnosticResults.rtdb?.success ? 'Connected' : 'Disconnected'} 
              color={diagnosticResults.rtdb?.success ? 'success' : 'error'}
              sx={{ mr: 1 }}
            />
            {diagnosticResults.rtdb?.error && (
              <Typography variant="body2" color="error">
                Error: {diagnosticResults.rtdb.error}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Authentication Status</Typography>
            <Chip 
              label={diagnosticResults.auth?.success ? 'Signed In' : 'Not Signed In'} 
              color={diagnosticResults.auth?.success ? 'success' : 'warning'}
              sx={{ mr: 1 }}
            />
            {diagnosticResults.auth?.currentUser && (
              <List dense>
                <ListItem>
                  <ListItemText primary="User ID" secondary={diagnosticResults.auth.currentUser.uid} />
                </ListItem>
                {diagnosticResults.auth.currentUser.email && (
                  <ListItem>
                    <ListItemText primary="Email" secondary={diagnosticResults.auth.currentUser.email} />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText 
                    primary="Account Type" 
                    secondary={diagnosticResults.auth.currentUser.isAnonymous ? 'Anonymous' : 'Registered'} 
                  />
                </ListItem>
              </List>
            )}
          </Box>
          
          {diagnosticResults.paths && (
            <Box>
              <Typography variant="subtitle1">Paths</Typography>
              <List dense>
                {diagnosticResults.paths.paths.map((path) => (
                  <ListItem key={path.path}>
                    <ListItemText 
                      primary={path.path} 
                      secondary={
                        path.error 
                          ? `Error: ${path.error}` 
                          : path.exists 
                            ? `${path.childCount} items`
                            : 'Path does not exist or not accessible'
                      }
                    />
                    <Chip 
                      label={path.exists ? 'Exists' : 'No Access'} 
                      color={path.exists ? 'success' : 'warning'} 
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {diagnosticResults.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Diagnostic Error</AlertTitle>
              {diagnosticResults.error}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FirebaseDiagnostic; 