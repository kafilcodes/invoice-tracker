import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Suspense, lazy } from 'react';

// Theme
import { lightTheme, darkTheme } from './theme/theme';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import InvoiceList from './pages/InvoiceList';
import InvoiceDetail from './pages/InvoiceDetail';
import NotFound from './pages/NotFound';

// Lazy-loaded components
const InvoiceCreate = lazy(() => import('./pages/InvoiceCreate'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Loader from './components/Loader';

// Fallback loading component for lazy-loaded routes
const LoadingFallback = () => <Loader />;

function App() {
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <ToastContainer position="top-right" theme={darkMode ? 'dark' : 'light'} />
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
                <Route path="/login" element={<Navigate to="/auth" />} />
                <Route path="/" element={!user ? <Navigate to="/auth" /> : <Navigate to="/dashboard" />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/invoices" element={<InvoiceList />} />
                  <Route path="/invoices/create" element={<InvoiceCreate />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail />} />
                  {user && user.role === 'admin' && (
                    <Route path="/users" element={<UserManagement />} />
                  )}
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<Navigate to="/auth" />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
