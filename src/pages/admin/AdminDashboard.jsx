import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Alert
} from '@mui/material';
import {
  PendingActions,
  CheckCircle,
  Cancel,
  Paid,
  MoreVert,
  Search,
  Receipt,
  AccountCircle,
  DownloadForOffline,
  TrendingUp,
  TrendingDown,
  FilterList,
  PieChart,
  AttachMoney,
  CurrencyRupee,
  Person as PersonIcon,
  NotificationsActive as NotificationIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { 
  getDashboardStats, 
  getRecentActivity,
  getInvoices 
} from '../../redux/slices/invoiceSlice';
import realtimeDb from '../../firebase/realtimeDatabase';

// Import chart components
import {
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Predefined colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const INVOICE_STATUS_COLORS = {
  pending: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  paid: '#2196f3'
};

// Custom Indian date format function
const formatIndianDate = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Format currency based on currency type (INR/USD)
const formatCurrency = (amount, currency = 'INR') => {
  return currency === 'INR' 
    ? `₹${amount.toLocaleString('en-IN')}`
    : `$${amount.toLocaleString('en-US')}`;
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [currency, setCurrency] = useState('INR');
  
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    users: { count: 0, loading: true, error: null },
    invoices: { count: 0, loading: true, error: null },
    recentActivity: { data: [], loading: true, error: null }
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getRecentActivity());
    dispatch(getInvoices({ limit: 5, sortField: 'createdAt', sortDirection: 'desc' }));
  }, [dispatch]);

  useEffect(() => {
    // Fetch user stats
    const fetchUserStats = async () => {
      try {
        const userResult = await realtimeDb.queryData('users');
        setStats(prev => ({
          ...prev,
          users: {
            count: userResult.data?.length || 0,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setStats(prev => ({
          ...prev,
          users: {
            ...prev.users,
            loading: false,
            error: 'Failed to load user stats'
          }
        }));
      }
    };

    // Fetch invoice stats
    const fetchInvoiceStats = async () => {
      try {
        const invoiceResult = await realtimeDb.queryData('invoices');
        setStats(prev => ({
          ...prev,
          invoices: {
            count: invoiceResult.data?.length || 0,
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error('Error fetching invoice stats:', error);
        setStats(prev => ({
          ...prev,
          invoices: {
            ...prev.invoices,
            loading: false,
            error: 'Failed to load invoice stats'
          }
        }));
      }
    };

    // Fetch recent activity
    const fetchRecentActivity = async () => {
      try {
        const logsResult = await realtimeDb.queryData('logs', {
          orderBy: 'timestamp',
          limitToLast: 5
        });
        
        setStats(prev => ({
          ...prev,
          recentActivity: {
            data: logsResult.data || [],
            loading: false,
            error: null
          }
        }));
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        setStats(prev => ({
          ...prev,
          recentActivity: {
            ...prev.recentActivity,
            loading: false,
            error: 'Failed to load recent activity'
          }
        }));
      }
    };

    fetchUserStats();
    fetchInvoiceStats();
    fetchRecentActivity();
  }, []);

  // Prepare pie chart data for invoice status
  const prepareStatusData = () => {
    if (!stats || !stats.counts) return [];
    
    return [
      { name: 'Pending', value: stats.counts.pending || 0, color: INVOICE_STATUS_COLORS.pending },
      { name: 'Approved', value: stats.counts.approved || 0, color: INVOICE_STATUS_COLORS.approved },
      { name: 'Rejected', value: stats.counts.rejected || 0, color: INVOICE_STATUS_COLORS.rejected },
      { name: 'Paid', value: stats.counts.paid || 0, color: INVOICE_STATUS_COLORS.paid }
    ];
  };

  // Prepare pie chart data for invoice categories
  const prepareCategoryData = () => {
    if (!stats || !stats.categories) return [];
    
    return Object.entries(stats.categories).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  // Prepare invoice trend data
  const prepareTrendData = () => {
    if (!stats || !stats.monthly) return [];
    
    return stats.monthly.map(({ month, year, count, amount }) => ({
      name: `${month}/${year.toString().substr(2)}`,
      count,
      amount: amount || 0
    }));
  };

  // Get percentage change from previous period
  const getChangePercentage = (current, previous) => {
    if (!previous) return 0;
    const change = ((current - previous) / previous) * 100;
    return Number(change.toFixed(1));
  };

  // Handle invoice menu open
  const handleMenuOpen = (event, invoice) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  // Handle invoice menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle view invoice action
  const handleViewInvoice = () => {
    navigate(`/admin/invoices/${selectedInvoice._id}`);
    handleMenuClose();
  };

  // Toggle currency
  const handleCurrencyToggle = () => {
    setCurrency(currency === 'INR' ? 'USD' : 'INR');
  };

  // Calculate statistics
  const totalInvoices = stats?.counts ? 
    Object.values(stats.counts).reduce((acc, curr) => acc + curr, 0) : 0;
  
  const pendingAmount = stats?.amounts?.pending || 0;
  const approvedAmount = stats?.amounts?.approved || 0;
  const rejectedAmount = stats?.amounts?.rejected || 0;
  const paidAmount = stats?.amounts?.paid || 0;
  
  const previousTotal = stats?.previousPeriod?.total || 0;
  const totalChange = getChangePercentage(totalInvoices, previousTotal);
  
  const previousAmount = stats?.previousPeriod?.amount || 0;
  const totalAmountChange = getChangePercentage(pendingAmount + approvedAmount + paidAmount, previousAmount);

  // Get appropriate status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" icon={<PendingActions />} />;
      case 'approved':
        return <Chip size="small" label="Approved" color="success" icon={<CheckCircle />} />;
      case 'rejected':
        return <Chip size="small" label="Rejected" color="error" icon={<Cancel />} />;
      case 'paid':
        return <Chip size="small" label="Paid" color="info" icon={<Paid />} />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const handleManageUsers = () => {
    navigate('/admin/users');
  };

  const handleViewInvoices = () => {
    navigate('/admin/invoices');
  };

  if (stats.users.loading || stats.invoices.loading || stats.recentActivity.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // Custom tooltip component for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2">
            Count: {payload[0].value}
          </Typography>
          <Typography variant="body2">
            Percentage: {((payload[0].value / totalInvoices) * 100).toFixed(1)}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Welcome back, {user?.name || user?.displayName || 'Admin'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleCurrencyToggle}
            startIcon={currency === 'INR' ? <CurrencyRupee /> : <AttachMoney />}
          >
            {currency}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/admin/invoices/create')}
            startIcon={<Receipt />}
          >
            New Invoice
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/reports')}
            startIcon={<DownloadForOffline />}
          >
            Reports
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Users Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  backgroundColor: 'primary.main',
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">Users</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total registered users
                </Typography>
              </Box>
            </Box>
            
            {stats.users.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : stats.users.error ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {stats.users.error}
              </Alert>
            ) : (
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                {stats.users.count}
              </Typography>
            )}
            
            <Button
              variant="outlined"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={handleManageUsers}
              sx={{ mt: 'auto' }}
            >
              Manage Users
            </Button>
          </Paper>
        </Grid>

        {/* Invoices Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  backgroundColor: 'secondary.main',
                  width: 48,
                  height: 48,
                  mr: 2
                }}
              >
                <Receipt />
              </Avatar>
              <Box>
                <Typography variant="h6">Invoices</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total invoices
                </Typography>
              </Box>
            </Box>
            
            {stats.invoices.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : stats.invoices.error ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {stats.invoices.error}
              </Alert>
            ) : (
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                {stats.invoices.count}
              </Typography>
            )}
            
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Receipt />}
              onClick={handleViewInvoices}
              sx={{ mt: 'auto' }}
            >
              View Invoices
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                mt: 1
              }}
            >
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/admin/users')}
              >
                Manage Users
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary"
                onClick={() => navigate('/admin/invoices')}
              >
                View Invoices
              </Button>
              
              <Button 
                variant="contained" 
                color="info"
                onClick={() => navigate('/admin/settings')}
              >
                System Settings
              </Button>
              
              <Button 
                variant="contained" 
                color="success"
                onClick={() => navigate('/admin/organization')}
              >
                Organization Settings
              </Button>
              
              <Button 
                variant="contained" 
                color="warning"
                onClick={() => navigate('/admin/logs')}
              >
                View Activity Logs
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {stats.recentActivity.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : stats.recentActivity.error ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {stats.recentActivity.error}
          </Alert>
        ) : stats.recentActivity.data.length === 0 ? (
          <Typography variant="body1" sx={{ py: 2, textAlign: 'center' }}>
            No recent activity found
          </Typography>
        ) : (
          <List>
            {stats.recentActivity.data.map((activity, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    <NotificationIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.type || 'Activity'}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {activity.userId && `User ID: ${activity.userId}`}
                      </Typography>
                      {activity.timestamp && ` - ${new Date(activity.timestamp).toLocaleString()}`}
                    </>
                  }
                />
                {activity.success && (
                  <Chip 
                    label="Success" 
                    color="success" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AdminDashboard; 