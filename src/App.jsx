import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Suspense, lazy, useEffect } from 'react';

// Theme
import { lightTheme, darkTheme } from './theme/theme';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import InvoiceList from './pages/InvoiceList';
import InvoiceDetail from './pages/InvoiceDetail';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ActivityLogs from './pages/admin/ActivityLogs';
import NotificationsPage from './pages/Notifications';

// Lazy-loaded components
const InvoiceCreate = lazy(() => import('./pages/InvoiceCreate'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const InvoiceApproval = lazy(() => import('./pages/InvoiceApproval'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const Organization = lazy(() => import('./pages/admin/Organization'));

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Loader from './components/Loader';
import AuthInitializer from './components/auth/AuthInitializer';
import { authUnsubscribe } from './firebase/firebaseInit';

// Fallback loading component for lazy-loaded routes
const LoadingFallback = () => <Loader />;

function App() {
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
  // Ensure cleanup on app unmount
  useEffect(() => {
    return () => {
      // Make sure to clean up any auth listeners when the app unmounts
      if (typeof authUnsubscribe === 'function') {
        authUnsubscribe();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} />
        {/* We can remove this since we're initializing in firebaseInit.js */}
        {/* <AuthInitializer /> */}
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path="/auth" element={!user ? <Auth /> : (
                  user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />
                )} />
                <Route path="/login" element={<Navigate to="/auth" />} />
                <Route path="/" element={!user ? <Navigate to="/auth" /> : (
                  user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />
                )} />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/logs" element={<ActivityLogs />} />
                  <Route path="/admin/organization" element={<Organization />} />
                  <Route path="/admin/profile" element={<Profile />} />
                  <Route path="/admin/invoices" element={<InvoiceList />} />
                  <Route path="/admin/invoices/create" element={<InvoiceCreate />} />
                  <Route path="/admin/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/admin/notifications" element={<NotificationsPage />} />
                </Route>
              </Route>

              {/* Reviewer/Regular user routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/invoices" element={<InvoiceList />} />
                  <Route path="/invoices/create" element={<InvoiceCreate />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  <Route path="/approvals" element={<InvoiceApproval />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/activity-logs" element={<ActivityLogs />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
