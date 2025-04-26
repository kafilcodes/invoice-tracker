import React, { useState, useEffect } from 'react';
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
  Alert,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  PendingActions,
  CheckCircle,
  Cancel,
  Paid,
  MoreVert,
  Search,
  Receipt,
  DownloadForOffline,
  TrendingUp,
  TrendingDown,
  FilterList,
  PieChart,
  AttachMoney as MoneyIcon,
  CurrencyRupee,
  ReceiptLong as ReceiptIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Pending as PendingIcon,
  MoreTime as OverdueIcon,
  Business as OrgIcon,
  LocalFireDepartment as HotIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  getRecentActivity,
  getInvoices 
} from '../../redux/slices/invoiceSlice';
import realtimeDb from '../../firebase/realtimeDb';
import databaseService from '../../firebase/database';
import { selectUser } from '../../redux/slices/authSlice';
import { useTheme } from '@mui/material/styles';
import { Link } from '@mui/material';

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
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user } = useSelector((state) => state.auth);

  const theme = useTheme();
  const [organizationData, setOrganizationData] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    overdue: 0,
    paid: 0
  });
  const [financialStats, setFinancialStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    overdueAmount: 0
  });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard data on component mount
  useEffect(() => {
    // Fetch recent activity and recent invoices
    dispatch(getRecentActivity());
    dispatch(getInvoices({ limit: 5, sortField: 'createdAt', sortDirection: 'desc' }));
  }, [dispatch]);

  useEffect(() => {
    if (user?.uid) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user's organization ID
      const userDataResult = await databaseService.getData(`users/${user.uid}`);
      
      if (!userDataResult.success || !userDataResult.data?.organization) {
        setError('Failed to get organization information');
        setLoading(false);
        return;
      }
      
      const organizationId = userDataResult.data.organization;
      
      // Get organization data
      const orgResult = await databaseService.getData(`organizations/${organizationId}`);
      
      if (orgResult.success && orgResult.data) {
        setOrganizationData(orgResult.data);
      }
      
      // Get invoices data
      const invoicesResult = await databaseService.getData(`organizations/${organizationId}/invoices`);
      
      if (invoicesResult.success && invoicesResult.data) {
        const invoicesData = invoicesResult.data;
        const invoices = Object.values(invoicesData);
        
        // Basic invoice stats
        const totalInvoices = invoices.length;
        const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
        const approvedInvoices = invoices.filter(i => i.status === 'approved').length;
        const rejectedInvoices = invoices.filter(i => i.status === 'rejected').length;
        const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
        const paidInvoices = invoices.filter(i => i.status === 'paid').length;
        
        setInvoiceStats({
          total: totalInvoices,
          pending: pendingInvoices,
          approved: approvedInvoices,
          rejected: rejectedInvoices,
          overdue: overdueInvoices,
          paid: paidInvoices
        });
        
        // Financial stats
        const totalAmount = invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
        const pendingAmount = invoices
          .filter(i => i.status === 'pending')
          .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
        const approvedAmount = invoices
          .filter(i => i.status === 'approved')
          .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
        const paidAmount = invoices
          .filter(i => i.status === 'paid')
          .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
        const overdueAmount = invoices
          .filter(i => i.status === 'overdue')
          .reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
        
        setFinancialStats({
          totalAmount,
          pendingAmount,
          approvedAmount,
          paidAmount,
          overdueAmount
        });
        
        // Monthly stats
        const today = new Date();
        const monthlyData = [];
        
        // Generate data for last 6 months
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          
          const monthInvoices = invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          });
          
          const monthTotal = monthInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
          
          monthlyData.push({
            name: format(month, 'MMM yyyy'),
            count: monthInvoices.length,
            amount: monthTotal,
            pending: monthInvoices.filter(i => i.status === 'pending').length,
            approved: monthInvoices.filter(i => i.status === 'approved').length,
            rejected: monthInvoices.filter(i => i.status === 'rejected').length,
            paid: monthInvoices.filter(i => i.status === 'paid').length
          });
        }
        
        setMonthlyStats(monthlyData);
      }
      
      // Get recent activity
      const activityResult = await databaseService.getData(`organizations/${organizationId}/activity`);
      
      if (activityResult.success && activityResult.data) {
        const activities = Object.values(activityResult.data);
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateB - dateA;
        });
        
        // Get 5 most recent activities
        setRecentActivity(activities.slice(0, 5));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  // Prepare pie chart data for invoice status
  const prepareStatusData = () => {
    return [
      { name: 'Pending', value: invoiceStats.pending || 0, color: INVOICE_STATUS_COLORS.pending },
      { name: 'Approved', value: invoiceStats.approved || 0, color: INVOICE_STATUS_COLORS.approved },
      { name: 'Rejected', value: invoiceStats.rejected || 0, color: INVOICE_STATUS_COLORS.rejected },
      { name: 'Paid', value: invoiceStats.paid || 0, color: INVOICE_STATUS_COLORS.paid }
    ];
  };

  // Prepare pie chart data for invoice categories
  const prepareCategoryData = () => {
    // Since we don't have categories in the current state structure,
    // we can return an empty array or mock data if needed
    return [];
  };

  // Prepare invoice trend data
  const prepareTrendData = () => {
    return monthlyStats.map(({ name, count, amount }) => ({
      name,
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

  // Get appropriate status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" icon={<PendingIcon />} />;
      case 'approved':
        return <Chip size="small" label="Approved" color="success" icon={<ApprovedIcon />} />;
      case 'rejected':
        return <Chip size="small" label="Rejected" color="error" icon={<RejectedIcon />} />;
      case 'paid':
        return <Chip size="small" label="Paid" color="info" icon={<Paid />} />;
      case 'overdue':
        return <Chip size="small" label="Overdue" color="error" icon={<OverdueIcon />} />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const handleViewInvoices = () => {
    navigate('/admin/invoices');
  };

  // Prepare data for pie chart
  const invoiceStatusData = [
    { name: 'Pending', value: invoiceStats.pending, color: theme.palette.warning.main },
    { name: 'Approved', value: invoiceStats.approved, color: theme.palette.success.main },
    { name: 'Rejected', value: invoiceStats.rejected, color: theme.palette.error.main },
    { name: 'Paid', value: invoiceStats.paid, color: theme.palette.primary.main },
    { name: 'Overdue', value: invoiceStats.overdue, color: theme.palette.secondary.main }
  ].filter(item => item.value > 0);
  
  // Get percentage of invoice processing
  const calculateCompletionRate = () => {
    if (invoiceStats.total === 0) return 0;
    const processed = invoiceStats.approved + invoiceStats.rejected + invoiceStats.paid;
    return Math.round((processed / invoiceStats.total) * 100);
  };
  
  const completionRate = calculateCompletionRate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }} 
            onClick={fetchDashboardData}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Organization Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: theme.shadows[3] }}>
        <Grid container spacing={3}>
          {/* Logo and Name */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Avatar 
              src={organizationData?.logo} 
              alt={organizationData?.name}
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                boxShadow: theme.shadows[4],
                border: '4px solid',
                borderColor: 'primary.light'
              }}
            >
              {!organizationData?.logo && <OrgIcon sx={{ fontSize: 60 }} />}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" align="center" gutterBottom>
              {organizationData?.name || 'Your Organization'}
            </Typography>
            {organizationData?.description && (
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
              {organizationData?.email && (
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
              
              {organizationData?.phone && (
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
              
              {organizationData?.website && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                    <LanguageIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Website</Typography>
                    <Typography variant="body1">
                      <Link href={organizationData.website} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                        {organizationData.website}
                      </Link>
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
              Address Details
            </Typography>
            
            {organizationData?.address && (
              <Box sx={{ display: 'flex', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 36, height: 36 }}>
                  <LocationIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{organizationData.address}</Typography>
                </Box>
              </Box>
            )}
            
            <Grid container spacing={2} sx={{ ml: 0 }}>
              {organizationData?.city && (
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">City</Typography>
                    <Typography variant="body1">{organizationData.city}</Typography>
                  </Box>
                </Grid>
              )}
              
              {organizationData?.state && (
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">State</Typography>
                    <Typography variant="body1">{organizationData.state}</Typography>
                  </Box>
                </Grid>
              )}
              
              {organizationData?.zip && (
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">ZIP Code</Typography>
                    <Typography variant="body1">{organizationData.zip}</Typography>
                  </Box>
                </Grid>
              )}
              
              {organizationData?.country && (
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
      
      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Invoice Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'primary.main', mr: 2 }}
                >
                  <ReceiptIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Invoices
                </Typography>
              </Box>
              
              <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                {invoiceStats.total}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Processing Rate
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={completionRate} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}>
                  {completionRate}% Processed
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  icon={<PendingIcon />}
                  label={`${invoiceStats.pending} Pending`}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<ApprovedIcon />}
                  label={`${invoiceStats.approved} Approved`}
                  color="success"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  icon={<RejectedIcon />}
                  label={`${invoiceStats.rejected} Rejected`}
                  color="error"
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Financial Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'success.main', mr: 2 }}
                >
                  <MoneyIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  Financials
                </Typography>
              </Box>
              
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                {formatCurrency(financialStats.totalAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total Invoice Amount
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(financialStats.pendingAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Approved:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(financialStats.approvedAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Paid:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    {formatCurrency(financialStats.paidAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Overdue:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="error.main">
                    {formatCurrency(financialStats.overdueAmount)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Hot Metrics */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', backgroundImage: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', mr: 2 }}
                >
                  <HotIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="white">
                  Key Metrics
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" color="white" gutterBottom>
                    Pending Amount
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Typography variant="h5" color="white" fontWeight="bold">
                      {formatCurrency(financialStats.pendingAmount)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, pb: 0.5 }}>
                      <TrendingUpIcon fontSize="small" sx={{ color: 'white' }} />
                      <Typography variant="caption" color="white">
                        Need Approval
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" color="white" gutterBottom>
                    Pending Invoices
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <Typography variant="h5" color="white" fontWeight="bold">
                      {invoiceStats.pending}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, pb: 0.5 }}>
                      <TrendingUpIcon fontSize="small" sx={{ color: 'white' }} />
                      <Typography variant="caption" color="white">
                        To Process
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Monthly Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Monthly Invoice Trend
            </Typography>
            
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" name="Number of Invoices" fill={theme.palette.primary.main} />
                  <Bar yAxisId="right" dataKey="amount" name="Total Amount ($)" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        
        {/* Invoice Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Invoice Status Distribution
            </Typography>
            
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {invoiceStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} invoices`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No invoice data available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 