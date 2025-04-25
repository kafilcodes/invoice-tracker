import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  TablePagination,
  Button,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon,
  ReceiptLong as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Paid as PaidIcon,
  Person as PersonIcon,
  PendingActions as PendingActionsIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import CustomDateFnsAdapter from '../../components/CustomDateFnsAdapter';

// Mock data for activity logs
const mockLogs = [
  {
    _id: "log1",
    action: "created",
    performedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com"
    },
    invoiceId: {
      _id: "inv1",
      vendorName: "Acme Corp",
      amount: 1500.75
    },
    timestamp: new Date('2023-07-15T10:30:00'),
    newStatus: "pending"
  },
  {
    _id: "log2",
    action: "approved",
    performedBy: {
      _id: "user2",
      name: "Jane Smith",
      email: "jane@example.com"
    },
    invoiceId: {
      _id: "inv2",
      vendorName: "Tech Solutions",
      amount: 2300.00
    },
    timestamp: new Date('2023-07-14T14:45:00'),
    previousStatus: "pending",
    newStatus: "approved"
  },
  {
    _id: "log3",
    action: "rejected",
    performedBy: {
      _id: "user3",
      name: "Robert Johnson",
      email: "robert@example.com"
    },
    invoiceId: {
      _id: "inv3",
      vendorName: "Office Supplies Inc",
      amount: 750.50
    },
    timestamp: new Date('2023-07-13T09:15:00'),
    previousStatus: "pending",
    newStatus: "rejected",
    reason: "Invoice amounts don't match the contract"
  },
  {
    _id: "log4",
    action: "paid",
    performedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com"
    },
    invoiceId: {
      _id: "inv2",
      vendorName: "Tech Solutions",
      amount: 2300.00
    },
    timestamp: new Date('2023-07-12T16:20:00'),
    previousStatus: "approved",
    newStatus: "paid"
  },
  {
    _id: "log5",
    action: "assigned",
    performedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com"
    },
    invoiceId: {
      _id: "inv4",
      vendorName: "Marketing Pros",
      amount: 3500.00
    },
    timestamp: new Date('2023-07-11T11:05:00'),
    previousStatus: "pending",
    newStatus: "pending",
    assignedTo: {
      _id: "user3",
      name: "Robert Johnson",
      email: "robert@example.com"
    }
  },
  {
    _id: "log6",
    action: "reassigned",
    performedBy: {
      _id: "user1",
      name: "John Doe",
      email: "john@example.com"
    },
    invoiceId: {
      _id: "inv5",
      vendorName: "IT Services LLC",
      amount: 1800.25
    },
    timestamp: new Date('2023-07-10T13:30:00'),
    previousAssignee: {
      _id: "user2",
      name: "Jane Smith",
      email: "jane@example.com"
    },
    assignedTo: {
      _id: "user3",
      name: "Robert Johnson",
      email: "robert@example.com"
    },
    message: "Please review this ASAP"
  }
];

const ActivityLogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    startDate: null,
    endDate: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch logs on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  // Load logs from API (simulated)
  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simulate API call
      // In a real app, you would use a Redux action here
      setTimeout(() => {
        setLogs(mockLogs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle page change
  const handleChangePage = (event, newValue) => {
    setPage(newValue);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      action: '',
      user: '',
      startDate: null,
      endDate: null,
    });
    setSearchQuery('');
  };

  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Navigate to invoice details
  const navigateToInvoice = (invoiceId) => {
    navigate(`/admin/invoices/${invoiceId}`);
  };

  // Filter logs based on search query and filters
  const filteredLogs = logs.filter((log) => {
    // Search query filter
    const searchFilter = 
      log.invoiceId?.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Action filter
    const actionFilter = !filters.action || log.action === filters.action;
    
    // User filter
    const userFilter = !filters.user || log.performedBy?._id === filters.user;
    
    // Date filters
    const startDateFilter = !filters.startDate || new Date(log.timestamp) >= filters.startDate;
    const endDateFilter = !filters.endDate || new Date(log.timestamp) <= filters.endDate;
    
    return searchFilter && actionFilter && userFilter && startDateFilter && endDateFilter;
  });
  
  // Get action chip
  const getActionChip = (action) => {
    switch (action) {
      case 'created':
        return <Chip icon={<ReceiptIcon />} label="Created" color="primary" size="small" />;
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" />;
      case 'paid':
        return <Chip icon={<PaidIcon />} label="Paid" color="info" size="small" />;
      case 'assigned':
        return <Chip icon={<PersonIcon />} label="Assigned" color="secondary" size="small" />;
      case 'reassigned':
        return <Chip icon={<PersonIcon />} label="Reassigned" color="secondary" size="small" />;
      default:
        return <Chip label={action} size="small" />;
    }
  };

  // Format action description
  const formatActionDescription = (log) => {
    switch (log.action) {
      case 'created':
        return `Created a new invoice for ${log.invoiceId?.vendorName}`;
      case 'approved':
        return `Approved invoice for ${log.invoiceId?.vendorName}`;
      case 'rejected':
        return `Rejected invoice for ${log.invoiceId?.vendorName}${log.reason ? ` - Reason: ${log.reason}` : ''}`;
      case 'paid':
        return `Marked invoice for ${log.invoiceId?.vendorName} as paid`;
      case 'assigned':
        return `Assigned invoice for ${log.invoiceId?.vendorName} to ${log.assignedTo?.name}`;
      case 'reassigned':
        return `Reassigned invoice for ${log.invoiceId?.vendorName} from ${log.previousAssignee?.name} to ${log.assignedTo?.name}${log.message ? ` - Message: ${log.message}` : ''}`;
      default:
        return `${log.action} invoice for ${log.invoiceId?.vendorName}`;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Activity Logs
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => {}}
        >
          Export Logs
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ px: 2 }}
          >
            <Tab label="All Activity" />
            <Tab label="Invoice Status Changes" />
            <Tab label="Assignments" />
            <Tab label="System Events" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                placeholder="Search logs..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              
              <Button
                variant={showFilters ? "contained" : "outlined"}
                color={showFilters ? "primary" : "inherit"}
                startIcon={<FilterAltIcon />}
                onClick={toggleFilters}
                size="small"
              >
                Filters
              </Button>
            </Box>
            
            <Tooltip title="Refresh logs">
              <IconButton onClick={loadLogs} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Filter panel */}
          {showFilters && (
            <Box sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="action-filter-label">Action</InputLabel>
                      <Select
                        labelId="action-filter-label"
                        id="action-filter"
                        value={filters.action}
                        label="Action"
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                      >
                        <MenuItem value="">All Actions</MenuItem>
                        <MenuItem value="created">Created</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="assigned">Assigned</MenuItem>
                        <MenuItem value="reassigned">Reassigned</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="user-filter-label">User</InputLabel>
                      <Select
                        labelId="user-filter-label"
                        id="user-filter"
                        value={filters.user}
                        label="User"
                        onChange={(e) => handleFilterChange('user', e.target.value)}
                      >
                        <MenuItem value="">All Users</MenuItem>
                        <MenuItem value="user1">John Doe</MenuItem>
                        <MenuItem value="user2">Jane Smith</MenuItem>
                        <MenuItem value="user3">Robert Johnson</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={CustomDateFnsAdapter}>
                      <DatePicker
                        label="From Date"
                        value={filters.startDate}
                        onChange={(date) => handleFilterChange('startDate', date)}
                        slotProps={{ 
                          textField: { 
                            size: 'small',
                            fullWidth: true,
                          } 
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={CustomDateFnsAdapter}>
                      <DatePicker
                        label="To Date"
                        value={filters.endDate}
                        onChange={(date) => handleFilterChange('endDate', date)}
                        slotProps={{ 
                          textField: { 
                            size: 'small',
                            fullWidth: true,
                          } 
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      startIcon={<ClearIcon />}
                      onClick={handleClearFilters}
                      sx={{ mr: 1 }}
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
          
          {/* Logs table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Date & Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={40} />
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No activity logs found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => (
                      <TableRow 
                        key={log._id} 
                        hover
                        onClick={() => navigateToInvoice(log.invoiceId?._id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{getActionChip(log.action)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatActionDescription(log)}
                          </Typography>
                          {log.invoiceId && (
                            <Typography variant="caption" color="text.secondary">
                              Invoice Amount: ${log.invoiceId.amount.toLocaleString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.performedBy?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.performedBy?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ActivityLogs; 