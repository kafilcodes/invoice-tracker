import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Grid, 
  Alert, 
  CircularProgress, 
  Divider,
  Chip
} from '@mui/material';
import { login, register, loginWithGoogle, logout } from '../redux/slices/authSlice';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';

const FirebaseAuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  const dispatch = useDispatch();
  const { user, isLoading, isAuthenticated, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (error) {
      setMessage(error.message || 'Authentication error');
      setSeverity('error');
    }
  }, [error]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email || !password || !name) {
      setMessage('Please fill all fields');
      setSeverity('warning');
      return;
    }
    
    try {
      await dispatch(register({ name, email, password })).unwrap();
      setMessage('Registration successful');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Registration failed');
      setSeverity('error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email || !password) {
      setMessage('Please enter email and password');
      setSeverity('warning');
      return;
    }
    
    try {
      await dispatch(login({ email, password })).unwrap();
      setMessage('Login successful');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Login failed');
      setSeverity('error');
    }
  };

  const handleGoogleLogin = async () => {
    setMessage('');
    
    try {
      await dispatch(loginWithGoogle()).unwrap();
      setMessage('Google login successful');
      setSeverity('success');
    } catch (err) {
      setMessage(err.message || 'Google login failed');
      setSeverity('error');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Chip
            icon={<AdminPanelSettingsIcon />}
            label="Admin"
            color="primary"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'reviewer':
        return (
          <Chip
            icon={<PersonIcon />}
            label="Reviewer"
            color="success"
          />
        );
      default:
        return (
          <Chip
            label={role || 'Unknown'}
            color="default"
          />
        );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Firebase Authentication Test
        </Typography>
        
        {message && (
          <Alert severity={severity} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}
        
        {isAuthenticated ? (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              You are logged in
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Name:</strong> {user?.name || user?.displayName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>User ID:</strong> {user?.uid || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Role:</strong> {getRoleChip(user?.role)}
                </Typography>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Logout'}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Register
              </Typography>
              <form onSubmit={handleRegister}>
                <TextField
                  label="Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Register'}
                </Button>
              </form>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Login
              </Typography>
              <form onSubmit={handleLogin}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Login'}
                </Button>
                
                <Divider sx={{ my: 2 }}>or</Divider>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  fullWidth
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Login with Google'}
                </Button>
              </form>
            </Grid>
          </Grid>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Role-Based Routes
        </Typography>
        <Typography variant="body1" paragraph>
          Reviewer users can access: <code>/dashboard</code>, <code>/invoices</code>, <code>/profile</code>
        </Typography>
        <Typography variant="body1" paragraph>
          Admin users can access: <code>/admin/dashboard</code>, <code>/admin/users</code>, <code>/admin/settings</code>
        </Typography>
      </Paper>
    </Box>
  );
};

export default FirebaseAuthTest; 