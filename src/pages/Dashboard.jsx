import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Typography, 
  Box,
  Container, 
  Grid,
  Paper,
  Button, 
  Card,
  CardContent,
  CardActions, 
  Avatar,
  Chip, 
  IconButton, 
  CircularProgress,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  LinearProgress,
  Badge,
  CardHeader,
  Stack,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Dashboard as DashboardIcon, 
  Assignment as AssignmentIcon, 
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  KeyboardArrowRight as ArrowIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as ClockIcon,
  Description as DescriptionIcon,
  PendingActions as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  BarChart as BarChartIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import realtimeDb from '../firebase/realtimeDb';
import { selectUser } from '../redux/slices/authSlice';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import Toast from '../components/common/Toast';
import billLogo from '/bill.png';
import { format } from 'date-fns';
import databaseService from '../firebase/database';

// Helper function to capitalize status
const capitalizeStatus = (status) => {
  if (!status || typeof status !== 'string') return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to safely get activity status
const getActivityStatus = (activity) => {
  if (!activity) return 'Unknown';
  if (!activity.status) return 'Unknown';
  return activity.status;
};

// Helper function to get bgcolor based on status with safety checks
const getStatusBgColor = (status) => {
  if (!status) return 'rgba(0, 0, 0, 0.1)';
  
  switch(status.toLowerCase()) {
      case 'approved':
      return 'rgba(76, 175, 80, 0.1)';
      case 'rejected':
      return 'rgba(244, 67, 54, 0.1)';
    case 'pending':
      return 'rgba(255, 152, 0, 0.1)';
      default:
      return 'rgba(0, 0, 0, 0.1)';
  }
};

// Custom components
const StatusChip = ({ status }) => {
  const getColor = () => {
    if (!status) return 'default';
    
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };
  
  return (
    <Chip 
      label={capitalizeStatus(status)} 
      color={getColor()} 
      size="small" 
      sx={{ textTransform: 'capitalize', fontWeight: 500 }}
    />
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, boxShadow: 3 }}>
        <Typography variant="body2">{`${payload[0].name}: ${payload[0].value}`}</Typography>
      </Paper>
    );
  }
  return null;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

// Dashboard skeleton loader component
const DashboardSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Welcome section skeleton */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? `linear-gradient(120deg, ${theme.palette.primary.dark} 0%, #2c3e50 100%)`
            : `linear-gradient(120deg, ${theme.palette.primary.main} 0%, #3f51b5 100%)`,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={12} lg={7}>
            <Skeleton variant="text" width="70%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Skeleton variant="text" width="90%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              <Skeleton variant="rounded" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Skeleton variant="rounded" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              <Skeleton variant="rounded" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} lg={5} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant="circular" width={180} height={180} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics cards skeleton */}
      <Grid container spacing={3} mb={4}>
        {[...Array(4)].map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 160,
                borderRadius: 2
              }}
              elevation={1}
            >
              <Skeleton variant="rounded" width={48} height={48} sx={{ alignSelf: 'flex-end', mb: 2 }} />
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={40} sx={{ my: 1 }} />
              <Skeleton variant="rounded" width="100%" height={6} sx={{ mt: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts skeleton */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 420,
              borderRadius: 2
            }}
            elevation={1}
          >
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={280} sx={{ mt: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Skeleton variant="rounded" width={60} height={24} sx={{ mx: 1 }} />
              <Skeleton variant="rounded" width={60} height={24} sx={{ mx: 1 }} />
              <Skeleton variant="rounded" width={60} height={24} sx={{ mx: 1 }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 420,
              borderRadius: 2
            }}
            elevation={1}
          >
            <Skeleton variant="text" width="50%" height={32} />
            <Skeleton variant="rectangular" width="100%" height={320} sx={{ mt: 3 }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Invoices and activity skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              mb: { xs: 3, md: 0 }
            }}
            elevation={2}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="text" width="30%" height={32} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width={100} height={36} />
                <Skeleton variant="rounded" width={100} height={36} />
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {[...Array(5)].map((_, index) => (
              <Card key={index} sx={{ mb: 2, borderRadius: 2, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ py: 2 }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} lg={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Box>
                          <Skeleton variant="text" width={80} height={20} />
                          <Skeleton variant="text" width={60} height={16} />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={6} lg={3}>
                      <Skeleton variant="text" width={40} height={16} />
                      <Skeleton variant="text" width={60} height={24} />
                    </Grid>
                    <Grid item xs={6} sm={6} lg={3}>
                      <Skeleton variant="text" width={40} height={16} />
                      <Skeleton variant="rounded" width={80} height={24} />
                    </Grid>
                    <Grid item xs={12} lg={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                      <Skeleton variant="circular" width={28} height={28} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3
            }}
            elevation={2}
          >
            <Skeleton variant="text" width="50%" height={32} />
            <Divider sx={{ mb: 2 }} />
            
            {[...Array(4)].map((_, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                {index < 3 && <Divider sx={{ my: 1 }} />}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const user = useSelector(selectUser);
  const userId = user?.uid;
  
  const [invoices, setInvoices] = useState([]);
  const [assignedInvoices, setAssignedInvoices] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalInvoices: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    totalAmount: 0,
    dailyProcessed: 0,
    monthlyProcessed: 0
  });
  const [organizationData, setOrganizationData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    invoiceId: null,
    action: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    title: '',
    severity: 'success'
  });

  // Fetch organization data based on user's organization
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!user?.organization) return;
    
      try {
        const orgResult = await databaseService.getData(`organizations/${user.organization}`);
        
        if (orgResult.success && orgResult.data) {
          setOrganizationData(orgResult.data);
        }
      } catch (error) {
        console.error('Error fetching organization data:', error);
      }
    };
    
    fetchOrganizationData();
  }, [user]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        
        // First, attempt to get organization ID from user object or fetch it
        let organizationId = user?.organization;
        
        if (!organizationId && user?.uid) {
          // Get user's organization from database
          const userDataResult = await databaseService.getData(`users/${user.uid}`);
        
          if (userDataResult.success && userDataResult.data?.organization) {
            organizationId = userDataResult.data.organization;
          } else {
            setError('Failed to get organization information');
            setLoading(false);
            return;
          }
        }
        
        if (organizationId) {
          // Get invoices for this organization
          const invoicesResult = await databaseService.getData(`organizations/${organizationId}/invoices`);
          
          if (invoicesResult.success && invoicesResult.data) {
            // Convert object to array with _id field
            const invoicesArray = Object.entries(invoicesResult.data).map(([id, data]) => ({
              _id: id,
              ...data
            }));
          
          // Calculate counts
            const pending = invoicesArray.filter(invoice => invoice.status === 'pending').length;
            const approved = invoicesArray.filter(invoice => invoice.status === 'approved').length;
            const rejected = invoicesArray.filter(invoice => invoice.status === 'rejected').length;
          
          // Update state
            setInvoices(invoicesArray);
            setAssignedInvoices(invoicesArray);
          setStats({
              totalInvoices: invoicesArray.length,
            approved,
            rejected,
            pending,
              totalAmount: invoicesArray.reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0).toFixed(2),
            dailyProcessed: 0,
            monthlyProcessed: 0
          });
            
            // Get recent activity
            fetchRecentActivity(organizationId);
          }
        } else {
          setError('Failed to get organization information');
        }
      } catch (error) {
        console.error('Error in fetchInvoices:', error);
        setError('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    
    // Set up realtime listener for invoices that works for all users including reviewers
    const setupRealtimeListener = async () => {
      try {
        // First, attempt to get organization ID from user object
        let organizationId = user?.organization;
        
        // If not available, fetch from database
        if (!organizationId && user?.uid) {
          const userDataResult = await databaseService.getData(`users/${user.uid}`);
          if (userDataResult.success && userDataResult.data?.organization) {
            organizationId = userDataResult.data.organization;
          } else {
            console.error('Failed to get organization ID for real-time updates');
            return null;
          }
        }
        
        if (organizationId) {
          // Subscribe to real-time updates for this organization's invoices
          return realtimeDb.subscribeToData(`organizations/${organizationId}/invoices`, data => {
      if (data) {
              // Convert object to array with _id field
              const invoicesArray = Object.entries(data).map(([id, invoiceData]) => ({
                _id: id,
                ...invoiceData
              }));
              
              setInvoices(invoicesArray);
              setAssignedInvoices(invoicesArray);
        
        // Update statistics
              const approved = invoicesArray.filter(inv => inv && inv.status === 'approved').length;
              const rejected = invoicesArray.filter(inv => inv && inv.status === 'rejected').length;
              const pending = invoicesArray.filter(inv => inv && inv.status === 'pending').length;
        
        // Calculate daily and monthly processed
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
              const dailyProcessed = invoicesArray.filter(inv => 
          inv && 
          (inv.updatedAt || 0) >= today && 
          (inv.status === 'approved' || inv.status === 'rejected')
        ).length;
        
              const monthlyProcessed = invoicesArray.filter(inv => 
          inv &&
          (inv.updatedAt || 0) >= thisMonth && 
          (inv.status === 'approved' || inv.status === 'rejected')
        ).length;
        
        setStats({
                totalInvoices: invoicesArray.length,
          approved,
          rejected,
          pending,
                totalAmount: invoicesArray.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0).toFixed(2),
          dailyProcessed,
          monthlyProcessed
        });
              
              // Also update the activity logs when invoice data changes
              fetchRecentActivity(organizationId);
      }
    });
        }
        return null;
      } catch (error) {
        console.error('Error setting up real-time listener:', error);
        return null;
      }
    };
    
    if (user?.uid) {
      fetchInvoices();
      
      const unsubscribePromise = setupRealtimeListener();
      
      // Cleanup function
    return () => {
        unsubscribePromise.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      };
    }
  }, [user]);

  const fetchRecentActivity = async (organizationId) => {
    if (!organizationId) return;
    
    try {
      // Fetch activity logs for this organization
      const activityResult = await databaseService.getData(`organizations/${organizationId}/activity`);
      
      if (activityResult.success && activityResult.data) {
        // Convert to array and sort by timestamp (newest first)
        const logsArray = Object.entries(activityResult.data)
          .map(([id, data]) => ({
            _id: id,
            ...data
          }))
          .filter(activity => activity !== null && activity !== undefined)
          .sort((a, b) => {
            // Handle server timestamps which might be objects
            const timestampA = typeof a.timestamp === 'object' ? a.timestamp?.seconds * 1000 : a.timestamp;
            const timestampB = typeof b.timestamp === 'object' ? b.timestamp?.seconds * 1000 : b.timestamp;
            return (timestampB || 0) - (timestampA || 0);
          })
          .slice(0, 5); // Get only the 5 most recent
        
        setRecentActivity(logsArray);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (filterStatus === 'all') return assignedInvoices;
    return assignedInvoices.filter(invoice => invoice.status === filterStatus);
  }, [assignedInvoices, filterStatus]);

  // Handler functions
  const handleCreateInvoice = () => {
    navigate('/create-invoice');
  };
  
  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };
  
  const handleApproveInvoice = (invoiceId) => {
    setConfirmDialog({
      open: true,
      title: 'Approve Invoice',
      message: 'Are you sure you want to approve this invoice? This action cannot be undone.',
      type: 'success',
      confirmText: 'Approve',
      invoiceId,
      action: 'approve'
    });
  };
  
  const handleRejectInvoice = (invoiceId) => {
    setConfirmDialog({
      open: true,
      title: 'Reject Invoice',
      message: 'Are you sure you want to reject this invoice? This action cannot be undone.',
      type: 'error',
      confirmText: 'Reject',
      invoiceId,
      action: 'reject'
    });
  };
  
  const handleViewAllInvoices = () => {
    navigate('/invoices');
  };
  
  const handleProfileView = () => {
    navigate('/profile');
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    handleFilterMenuClose();
  };

  const handleDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };
  
  const handleConfirmAction = async () => {
    try {
      setActionLoading(true);
      const { invoiceId, action } = confirmDialog;
      
      if (!invoiceId || !action) {
        return;
      }
      
      if (action === 'approve') {
        await processInvoice(invoiceId, 'approved');
        setToast({
          open: true,
          title: 'Success',
          message: 'Invoice has been approved successfully',
          severity: 'success'
        });
      } else if (action === 'reject') {
        await processInvoice(invoiceId, 'rejected');
        setToast({
          open: true,
          title: 'Success',
          message: 'Invoice has been rejected successfully',
          severity: 'info'
        });
      }
      
      // Close dialog and reset loading
      setConfirmDialog({
        ...confirmDialog,
        open: false
      });
    } catch (error) {
      console.error('Error processing invoice:', error);
      setToast({
        open: true,
        title: 'Error',
        message: `Failed to process invoice: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const processInvoice = async (invoiceId, status) => {
    try {
      setActionLoading(true);
      
      // Get current invoice data
      const invoiceResponse = await realtimeDb.getData(`invoices/${invoiceId}`);
      
      if (!invoiceResponse.success || !invoiceResponse.data) {
        throw new Error('Invoice not found');
      }
      
      const invoice = invoiceResponse.data;
      
      // Update the invoice status
      const updateResponse = await realtimeDb.updateData(`invoices/${invoiceId}`, {
        status,
        reviewedBy: userId,
        reviewedByName: user?.displayName || 'Unknown',
        reviewDate: new Date().toISOString()
      });
      
      if (!updateResponse.success) {
        throw new Error('Failed to update invoice');
      }
      
      // Log the activity
      await realtimeDb.logActivity({
        type: status,
        description: `Invoice ${invoice.invoiceNumber} was ${status}`,
        userId: userId,
        userName: user?.displayName || 'Unknown',
        entityType: 'invoice',
        entityId: invoiceId,
        details: `Invoice ${invoice.invoiceNumber} was ${status} by ${user?.displayName || 'Unknown'}`
      });
      
      // Create a notification for the invoice creator
      if (invoice.createdBy && invoice.createdBy !== userId) {
        await realtimeDb.addNotification(invoice.createdBy, {
          message: `Your invoice ${invoice.invoiceNumber} was ${status}`,
          type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
          relatedTo: 'invoice',
          relatedId: invoiceId
        });
      }
      
      setToast({
        open: true,
        title: 'Success',
        message: `Invoice ${status} successfully`,
        severity: 'success'
      });
      
      // Refresh data
      fetchInvoices();
      fetchRecentActivity();
      
      // Close dialog
      setConfirmDialog({
        ...confirmDialog,
        open: false
      });
    } catch (error) {
      console.error(`Error ${status} invoice:`, error);
      setToast({
        open: true,
        title: 'Error',
        message: `Failed to ${status} invoice: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCloseToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast({
      ...toast,
      open: false
    });
  };

    return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: '100%' }}>
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome section with quick stats */}
          <motion.div variants={itemVariants}>
            <Paper
              elevation={3}
        sx={{
                p: 4,
                mb: 4,
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                backgroundImage: 'linear-gradient(120deg, #6a11cb 0%, #2575fc 100%)',
                color: 'white',
          display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Welcome back, {user?.displayName}
        </Typography>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                Your invoice management summary for today
        </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<DescriptionIcon sx={{ color: 'white !important' }} />}
                  label={`${stats.totalInvoices} Total Invoices`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip
                  icon={<PendingIcon sx={{ color: 'white !important' }} />}
                  label={`${stats.pending} Pending Review`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip
                  icon={<CheckCircleIcon sx={{ color: 'white !important' }} />}
                  label={`${stats.dailyProcessed} Processed Today`}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
      </Box>

              <Box sx={{ 
                position: 'absolute', 
                right: 30, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                display: { xs: 'none', md: 'block' } 
              }}>
                <img 
                  src={billLogo} 
                  alt="Invoice Tracker" 
                  style={{ 
                    width: 120, 
                    height: 120, 
                    opacity: 0.7,
                    filter: 'brightness(0) invert(1)'
                  }} 
                />
              </Box>
            </Paper>
          </motion.div>

          {/* Organization Info Section */}
          {organizationData && (
            <motion.div variants={itemVariants}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 2,
                  boxShadow: theme.shadows[2]
                }}
              >
                <Grid container spacing={3}>
                  {/* Organization Logo and Name */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar 
                      src={organizationData.logo} 
                      alt={organizationData.name}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mb: 2,
                        boxShadow: theme.shadows[2],
                        border: '3px solid',
                        borderColor: 'primary.light'
                      }}
                    >
                      {!organizationData.logo && <OrgIcon sx={{ fontSize: 50 }} />}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold" align="center" gutterBottom>
                      {organizationData.name || 'Your Organization'}
                    </Typography>
                    {organizationData.description && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        {organizationData.description}
                      </Typography>
                    )}
                  </Grid>
                  
                  {/* Contact Details */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ 
                        mr: 1, 
                        bgcolor: 'primary.main', 
                        width: 4, 
                        height: 20, 
                        display: 'inline-block', 
                        borderRadius: 1 
                      }}></Box>
                      Contact Information
                    </Typography>
                    
                    <Stack spacing={2}>
                      {organizationData.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                            <EmailIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{organizationData.email}</Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {organizationData.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                            <PhoneIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                            <Typography variant="body1">{organizationData.phone}</Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {organizationData.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                            <LanguageIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Website</Typography>
                            <Typography variant="body1">
                              <Button 
                                href={organizationData.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                              >
                                {organizationData.website}
                              </Button>
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                  
                  {/* Address Details */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ 
                        mr: 1, 
                        bgcolor: 'primary.main', 
                        width: 4, 
                        height: 20, 
                        display: 'inline-block', 
                        borderRadius: 1 
                      }}></Box>
                      Address Information
                    </Typography>
                    
                    {organizationData.address && (
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                          <LocationOnIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Address</Typography>
                          <Typography variant="body1">{organizationData.address}</Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Grid container spacing={2} sx={{ ml: 0 }}>
                      {organizationData.city && (
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">City</Typography>
                            <Typography variant="body1">{organizationData.city}</Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {organizationData.state && (
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">State</Typography>
                            <Typography variant="body1">{organizationData.state}</Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {organizationData.zip && (
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">ZIP Code</Typography>
                            <Typography variant="body1">{organizationData.zip}</Typography>
                          </Box>
                        </Grid>
                      )}
                      
                      {organizationData.country && (
                        <Grid item xs={6}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Country</Typography>
                            <Typography variant="body1">{organizationData.country}</Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          )}

          {/* Statistics cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Paper
              sx={{
                    p: 3,
                display: 'flex',
                flexDirection: 'column',
                    height: 160,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    }
                  }}
                  elevation={1}
                >
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    color: 'success.main'
                  }}>
                    <ApproveIcon fontSize="medium" />
                  </Box>
                  <Typography variant="overline" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 1, pr: 6 }}>
                    Total Invoices
              </Typography>
                  <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                    {stats.totalInvoices}
              </Typography>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={100} 
                      sx={{ height: 6, borderRadius: 3 }}
                      color="primary"
                    />
            </Box>
          </Paper>
              </motion.div>
        </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Paper
              sx={{
                    p: 3,
                display: 'flex',
                flexDirection: 'column',
                    height: 160,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    }
                  }}
                  elevation={1}
                >
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                    color: 'success.main'
                  }}>
                    <ApproveIcon fontSize="medium" />
                  </Box>
                  <Typography variant="overline" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 1, pr: 6 }}>
                Approved
              </Typography>
                  <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'success.main' }}>
                    {stats.approved}
              </Typography>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.approved / (stats.totalInvoices || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 3 }}
                      color="success"
                    />
            </Box>
          </Paper>
              </motion.div>
        </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Paper
              sx={{
                    p: 3,
                display: 'flex',
                flexDirection: 'column',
                    height: 160,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    }
                  }}
                  elevation={1}
                >
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    color: 'error.main'
                  }}>
                    <RejectIcon fontSize="medium" />
                  </Box>
                  <Typography variant="overline" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 1, pr: 6 }}>
                Rejected
              </Typography>
                  <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'error.main' }}>
                    {stats.rejected}
                  </Typography>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.rejected / (stats.totalInvoices || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 3 }}
                      color="error"
                    />
            </Box>
          </Paper>
              </motion.div>
        </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <motion.div variants={itemVariants}>
                <Paper
              sx={{
                    p: 3,
                display: 'flex',
                flexDirection: 'column',
                    height: 160,
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
                    }
                  }}
                  elevation={1}
                >
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute', 
                    top: 16, 
                    right: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(255, 152, 0, 0.1)',
                    color: 'warning.main'
                  }}>
                    <ClockIcon fontSize="medium" />
                  </Box>
                  <Typography variant="overline" color="text.secondary" gutterBottom fontWeight="medium" sx={{ mt: 1, pr: 6 }}>
                    Pending
              </Typography>
                  <Typography variant="h3" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'warning.main' }}>
                    {stats.pending}
              </Typography>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.pending / (stats.totalInvoices || 1)) * 100} 
                      sx={{ height: 6, borderRadius: 3 }}
                      color="warning"
                    />
            </Box>
          </Paper>
              </motion.div>
        </Grid>
      </Grid>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleDialogClose}
        onConfirm={handleConfirmAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type={confirmDialog.type}
        loading={actionLoading}
      />
      
      {/* Toast Notification */}
      <Toast
        open={toast.open}
        onClose={handleCloseToast}
        message={toast.message}
        title={toast.title}
        severity={toast.severity}
      />
    </Box>
  );
};

export default Dashboard; 