import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Log authentication state for debugging
    console.log('Protected route check:', { 
      isAuthenticated, 
      isLoading, 
      userExists: !!user, 
      userRole: user?.role,
      requiredRole 
    });
    
    // Validate role if user exists and required role is provided
    if (user && requiredRole && !['admin', 'reviewer'].includes(user.role)) {
      console.error(`Invalid user role detected: ${user.role}`);
      setError(`Invalid role: ${user.role}. Please contact support.`);
    } else {
      setError(null);
    }
  }, [user, requiredRole, isAuthenticated, isLoading]);

  // Show loading indicator
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your account...
        </Typography>
      </Box>
    );
  }

  // Show error if role validation failed
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '/auth'}
        >
          Back to Login
        </Button>
      </Box>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    console.log('User not authenticated, redirecting to auth page');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If route requires specific role and user doesn't have it
  if (requiredRole && user.role !== requiredRole) {
    console.log(`User does not have required role: ${requiredRole}, current role: ${user.role}`);
    
    // Redirect admin to admin dashboard
    if (user.role === 'admin') {
      console.log('Redirecting admin to admin dashboard');
      return <Navigate to="/admin/dashboard" replace />;
  }

    // Redirect regular user to user dashboard
    console.log('Redirecting user to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Access granted to protected route');
  // Render children routes
  return <Outlet />;
};

export default ProtectedRoute; 