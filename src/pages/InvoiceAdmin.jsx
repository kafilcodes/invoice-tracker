import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Avatar,
  Badge,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TimerOutlined as PendingIcon,
  VisibilityOutlined as ViewIcon,
  HistoryOutlined as HistoryIcon,
  Person as PersonIcon,
  SortOutlined as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachFile as AttachmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { fetchInvoices, updateInvoiceStatus, deleteInvoice } from '../redux/slices/invoiceSlice';
import { fetchUsersByOrganization } from '../redux/slices/usersSlice';
import { alpha } from '@mui/material/styles';

// Invoice status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending', color: 'warning', icon: <PendingIcon /> },
  { value: 'approved', label: 'Approved', color: 'success', icon: <CheckCircleIcon /> },
  { value: 'rejected', label: 'Rejected', color: 'error', icon: <CancelIcon /> },
];

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const InvoiceAdmin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.invoices);
  const { user, organization } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);

  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // State for action menus and dialogs
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  
  // Fetch invoices and users on component mount
  useEffect(() => {
    if (organization?.id) {
      dispatch(fetchInvoices(organization.id));
      dispatch(fetchUsersByOrganization(organization.id));
    }
  }, [dispatch, organization]);

  // Handle tab change
  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Open action menu
  const handleOpenActionMenu = (event, invoice) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
  };

  // Close action menu
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };

  // Handle viewing invoice details
  const handleViewInvoice = (invoiceId) => {
    handleCloseActionMenu();
    navigate(`/invoices/${invoiceId}`);
  };

  // Handle editing invoice
  const handleEditInvoice = (invoiceId) => {
    handleCloseActionMenu();
    navigate(`/invoices/${invoiceId}/edit`);
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = () => {
    handleCloseActionMenu();
    setDeleteDialogOpen(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Handle confirming delete
  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteInvoice({ 
        organizationId: organization.id,
        invoiceId: selectedInvoice.id 
      })).unwrap();
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  // Handle opening status change dialog
  const handleOpenStatusDialog = (status) => {
    handleCloseActionMenu();
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  // Handle closing status dialog
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
  };

  // Handle confirming status change
  const handleConfirmStatusChange = async () => {
    try {
      await dispatch(updateInvoiceStatus({ 
        organizationId: organization.id,
        invoiceId: selectedInvoice.id,
        status: newStatus,
        updatedBy: user.uid
      })).unwrap();
      
      handleCloseStatusDialog();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  // Toggle expanded invoice for activity history
  const handleToggleExpand = (invoiceId) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  // Filter invoices
  const filteredInvoices = invoices
    ? invoices.filter((invoice) => {
        // Filter by status
        if (statusFilter !== 'all' && invoice.status !== statusFilter) {
          return false;
        }
        
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
            invoice.vendorName?.toLowerCase().includes(searchLower) ||
            invoice.organizationRemark?.toLowerCase().includes(searchLower) ||
            invoice.notes?.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
    : [];

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    // Convert to dates if sorting by date fields
    if (['createdAt', 'issueDate', 'dueDate'].includes(sortField)) {
      const dateA = a[sortField] ? new Date(a[sortField]) : new Date(0);
      const dateB = b[sortField] ? new Date(b[sortField]) : new Date(0);
      
      return sortDirection === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    }
    
    // Sort by amount
    if (sortField === 'amount') {
      return sortDirection === 'asc' 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    }
    
    // Sort by text fields
    const valueA = a[sortField] || '';
    const valueB = b[sortField] || '';
    
    return sortDirection === 'asc' 
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  // Paginate invoices
  const paginatedInvoices = sortedInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get user name by ID
  const getUserName = (userId) => {
    const user = users?.find(user => user._id === userId);
    return user ? (user.name || user.email) : 'Unknown User';
  };

  // Render status chip with improved styling
  const renderStatusChip = (status) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0];
    
    return (
      <Chip
        icon={statusOption.icon}
        label={statusOption.label}
        color={statusOption.color}
        size="small"
        variant="filled"
        sx={{ 
          borderRadius: 1.5,
          height: 28,
          '& .MuiChip-label': { 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1
          },
          '& .MuiChip-icon': {
            fontSize: '1rem',
            ml: 0.5
          },
          bgcolor: theme => 
            status === 'pending' ? alpha(theme.palette.warning.main, 0.15) :
            status === 'approved' ? alpha(theme.palette.success.main, 0.15) :
            status === 'rejected' ? alpha(theme.palette.error.main, 0.15) :
            undefined,
          color: theme => 
            status === 'pending' ? theme.palette.warning.dark :
            status === 'approved' ? theme.palette.success.dark :
            status === 'rejected' ? theme.palette.error.dark :
            undefined,
          boxShadow: theme => 
            `0 0 0 1px ${
              status === 'pending' ? alpha(theme.palette.warning.main, 0.2) :
              status === 'approved' ? alpha(theme.palette.success.main, 0.2) :
              status === 'rejected' ? alpha(theme.palette.error.main, 0.2) :
              'transparent'
            }`
        }}
      />
    );
  };

  // Render reviewer badges with improved styling
  const renderReviewerBadges = (reviewers) => {
    if (!reviewers || reviewers.length === 0) {
      return (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontStyle: 'italic',
            fontSize: '0.75rem'
          }}
        >
          None assigned
        </Typography>
      );
    }
    
    const displayCount = 3;
    const displayReviewers = reviewers.slice(0, displayCount);
    const remainingCount = reviewers.length - displayCount;
    
    return (
      <Stack direction="row" spacing={-0.5}>
        {displayReviewers.map((reviewer, index) => (
          <Tooltip 
            key={reviewer.id || index} 
            title={reviewer.name || reviewer.email || 'Unknown'}
            arrow
            placement="top"
          >
            <Avatar
              alt={reviewer.name || reviewer.email || 'Unknown'}
              src={reviewer.photoURL}
              sx={{ 
                width: 32, 
                height: 32, 
                border: '2px solid white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                bgcolor: theme => {
                  // Generate consistent color based on name or email
                  const nameKey = (reviewer.name || reviewer.email || '?').charAt(0).toLowerCase();
                  const colorIndex = nameKey.charCodeAt(0) % 6;
                  const colors = [
                    theme.palette.primary.main,
                    theme.palette.secondary.main,
                    theme.palette.success.main,
                    theme.palette.info.main,
                    theme.palette.warning.main,
                    theme.palette.error.main
                  ];
                  return colors[colorIndex];
                },
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  zIndex: 1,
                  transition: 'transform 0.2s ease'
                }
              }}
            >
              {(reviewer.name || reviewer.email || '?')?.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip 
            title={`${remainingCount} more reviewer${remainingCount > 1 ? 's' : ''}`}
            arrow
            placement="top"
          >
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                border: '2px solid white',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'primary.main',
                  transform: 'scale(1.1)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              +{remainingCount}
            </Avatar>
          </Tooltip>
        )}
      </Stack>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary.main">
            Invoice Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View, manage, and track all invoices in your organization
          </Typography>
        </Box>

        <Paper 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
          elevation={0}
        >
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              },
              '& .MuiTab-root': {
                fontWeight: 600,
                minHeight: 56,
                fontSize: '0.95rem',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: 'primary.main'
                }
              }
            }}
          >
            <Tab label="All Invoices" />
            <Tab label="Pending Review" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
          
          <Box sx={{ p: { xs: 2, md: 3 }, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by invoice number, vendor, or description..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: 2, 
                      bgcolor: 'background.paper',
                      '&:hover': {
                        bgcolor: 'background.default'
                      },
                      height: 54
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'flex-start', md: 'center' }
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      icon={option.icon}
                      label={option.label}
                      onClick={() => handleStatusFilterChange(option.value)}
                      color={statusFilter === option.value ? (option.color || 'primary') : 'default'}
                      variant={statusFilter === option.value ? 'filled' : 'outlined'}
                      clickable
                      sx={{ 
                        borderRadius: 1.5,
                        height: 36,
                        '& .MuiChip-label': {
                          px: 1.5,
                          fontWeight: statusFilter === option.value ? 600 : 400
                        },
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/invoices/create')}
                  fullWidth
                  size="large"
                  sx={{ 
                    boxShadow: 2,
                    borderRadius: 2,
                    height: 54,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Invoice
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* All Invoices Tab */}
        <TabPanel value={currentTab} index={0}>
          <InvoiceTable
            invoices={paginatedInvoices}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            totalCount={filteredInvoices.length}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onActionClick={handleOpenActionMenu}
            onExpandClick={handleToggleExpand}
            expandedInvoice={expandedInvoice}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getUserName={getUserName}
            renderStatusChip={renderStatusChip}
            renderReviewerBadges={renderReviewerBadges}
          />
        </TabPanel>

        {/* Pending Review Tab */}
        <TabPanel value={currentTab} index={1}>
          <InvoiceTable
            invoices={paginatedInvoices.filter(invoice => invoice.status === 'pending')}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            totalCount={filteredInvoices.filter(invoice => invoice.status === 'pending').length}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onActionClick={handleOpenActionMenu}
            onExpandClick={handleToggleExpand}
            expandedInvoice={expandedInvoice}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getUserName={getUserName}
            renderStatusChip={renderStatusChip}
            renderReviewerBadges={renderReviewerBadges}
          />
        </TabPanel>

        {/* Approved Tab */}
        <TabPanel value={currentTab} index={2}>
          <InvoiceTable
            invoices={paginatedInvoices.filter(invoice => invoice.status === 'approved')}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            totalCount={filteredInvoices.filter(invoice => invoice.status === 'approved').length}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onActionClick={handleOpenActionMenu}
            onExpandClick={handleToggleExpand}
            expandedInvoice={expandedInvoice}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getUserName={getUserName}
            renderStatusChip={renderStatusChip}
            renderReviewerBadges={renderReviewerBadges}
          />
        </TabPanel>

        {/* Rejected Tab */}
        <TabPanel value={currentTab} index={3}>
          <InvoiceTable
            invoices={paginatedInvoices.filter(invoice => invoice.status === 'rejected')}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            totalCount={filteredInvoices.filter(invoice => invoice.status === 'rejected').length}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            onActionClick={handleOpenActionMenu}
            onExpandClick={handleToggleExpand}
            expandedInvoice={expandedInvoice}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getUserName={getUserName}
            renderStatusChip={renderStatusChip}
            renderReviewerBadges={renderReviewerBadges}
          />
        </TabPanel>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleCloseActionMenu}
        >
          <MenuItem onClick={() => handleViewInvoice(selectedInvoice?.id)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            View Details
          </MenuItem>
          
          <MenuItem onClick={() => handleEditInvoice(selectedInvoice?.id)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            Edit Invoice
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={() => handleOpenStatusDialog('approved')}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            Approve Invoice
          </MenuItem>
          
          <MenuItem onClick={() => handleOpenStatusDialog('rejected')}>
            <ListItemIcon>
              <CancelIcon fontSize="small" color="error" />
            </ListItemIcon>
            Reject Invoice
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleOpenDeleteDialog}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            Delete Invoice
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Delete Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete invoice #{selectedInvoice?.invoiceNumber}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog
          open={statusDialogOpen}
          onClose={handleCloseStatusDialog}
        >
          <DialogTitle>
            {newStatus === 'approved' ? 'Approve Invoice' : 'Reject Invoice'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to {newStatus === 'approved' ? 'approve' : 'reject'} invoice #{selectedInvoice?.invoiceNumber}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseStatusDialog}>Cancel</Button>
            <Button 
              onClick={handleConfirmStatusChange} 
              color={newStatus === 'approved' ? 'success' : 'error'} 
              variant="contained"
            >
              {newStatus === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

// Invoice Table Component
const InvoiceTable = ({
  invoices,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  totalCount,
  sortField,
  sortDirection,
  onSortChange,
  onActionClick,
  onExpandClick,
  expandedInvoice,
  formatCurrency,
  formatDate,
  getUserName,
  renderStatusChip,
  renderReviewerBadges
}) => {
  // Column definitions
  const columns = [
    { id: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { id: 'vendorName', label: 'Vendor', sortable: true },
    { id: 'amount', label: 'Amount', sortable: true },
    { id: 'issueDate', label: 'Issue Date', sortable: true },
    { id: 'dueDate', label: 'Due Date', sortable: true },
    { id: 'status', label: 'Status', sortable: true },
    { id: 'reviewers', label: 'Reviewers', sortable: false },
    { id: 'actions', label: 'Actions', sortable: false },
  ];

  return (
    <Card variant="outlined" sx={{ 
      borderRadius: 2, 
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <CardContent sx={{ p: 0 }}>
        {loading && <LinearProgress color="primary" sx={{ height: 3 }} />}
        
        <TableContainer sx={{ 
          maxHeight: 'calc(100vh - 300px)',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          }
        }}>
          <Table sx={{ minWidth: 750 }} stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'background.paper' } }}>
                <TableCell padding="checkbox" sx={{ 
                  pl: 2,
                  width: 48,
                  borderBottom: 2,
                  borderColor: 'divider'
                }} />
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    sortDirection={sortField === column.id ? sortDirection : false}
                    sx={{ 
                      fontWeight: 700, 
                      borderBottom: 2,
                      borderColor: 'divider',
                      color: sortField === column.id ? 'primary.main' : 'inherit',
                      transition: 'all 0.2s'
                    }}
                  >
                    {column.sortable ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                        onClick={() => onSortChange(column.id)}
                      >
                        {column.label}
                        {sortField === column.id ? (
                          <SortIcon 
                            sx={{ 
                              ml: 0.5, 
                              fontSize: '1rem',
                              transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.3s'
                            }} 
                          />
                        ) : null}
                      </Box>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {loading && (!invoices || invoices.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">
                        Loading invoices...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (!invoices || invoices.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <img 
                        src="/empty-state.svg" 
                        alt="No invoices found" 
                        style={{ width: 120, height: 120, opacity: 0.6 }} 
                      />
                      <Typography variant="body1" color="text.secondary" fontWeight="medium">
                        No invoices found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search or filter criteria
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <React.Fragment key={invoice.id}>
                    <TableRow
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        borderLeft: expandedInvoice === invoice.id ? 
                          '3px solid' : '3px solid transparent',
                        borderLeftColor: 'primary.main',
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ pl: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => onExpandClick(invoice.id)}
                          sx={{ 
                            color: expandedInvoice === invoice.id ? 'primary.main' : 'text.secondary',
                            bgcolor: expandedInvoice === invoice.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          {expandedInvoice === invoice.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      
                      <TableCell sx={{ fontWeight: 'medium' }}>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.vendorName}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{renderStatusChip(invoice.status)}</TableCell>
                      <TableCell>{renderReviewerBadges(invoice.assignedReviewers)}</TableCell>
                      
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={(event) => {
                            event.stopPropagation();
                            onActionClick(event, invoice);
                          }}
                          color="primary"
                          sx={{ 
                            bgcolor: 'action.hover',
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText'
                            }
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    
                    {/* Activity history and details */}
                    <TableRow>
                      <TableCell 
                        colSpan={columns.length + 1} 
                        sx={{ 
                          p: 0, 
                          borderBottom: expandedInvoice === invoice.id ? 2 : 'none',
                          borderBottomColor: expandedInvoice === invoice.id ? 'divider' : 'none',
                        }}
                      >
                        <Collapse in={expandedInvoice === invoice.id} timeout="auto" unmountOnExit>
                          <Box sx={{ 
                            py: 2, 
                            px: 3, 
                            bgcolor: 'background.default',
                            borderTop: '1px dashed',
                            borderTopColor: 'divider'
                          }}>
                            <Typography variant="subtitle1" fontWeight="bold" component="div" color="primary.main">
                              Activity History
                            </Typography>
                            
                            {invoice.activity && invoice.activity.length > 0 ? (
                              <List sx={{ mt: 1 }}>
                                {invoice.activity.map((activity, index) => (
                                  <ListItem 
                                    key={index} 
                                    sx={{ 
                                      py: 1,
                                      px: 2,
                                      borderRadius: 1,
                                      mb: 1,
                                      bgcolor: 'background.paper',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <ListItemAvatar>
                                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                        <HistoryIcon fontSize="small" />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={<Typography variant="body2" fontWeight="medium">{activity.action}</Typography>}
                                      secondary={
                                        <Typography variant="caption" color="text.secondary">
                                          {formatDate(activity.timestamp)} by <b>{getUserName(activity.userId)}</b>
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, py: 2, textAlign: 'center' }}>
                                No activity recorded
                              </Typography>
                            )}
                            
                            {invoice.attachments && invoice.attachments.length > 0 && (
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                  Attachments
                                </Typography>
                                
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                                  {invoice.attachments.map((attachment, index) => (
                                    <Chip
                                      key={index}
                                      icon={<AttachmentIcon />}
                                      label={attachment.name}
                                      component="a"
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      clickable
                                      variant="outlined"
                                      color="primary"
                                      sx={{ 
                                        my: 0.5,
                                        borderRadius: 1.5,
                                        '&:hover': {
                                          bgcolor: 'primary.light',
                                          color: 'primary.contrastText',
                                          '& .MuiChip-icon': {
                                            color: 'primary.contrastText'
                                          }
                                        }
                                      }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                            
                            {invoice.notes && (
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                  Notes
                                </Typography>
                                <Paper 
                                  variant="outlined" 
                                  sx={{ 
                                    p: 2, 
                                    mt: 1, 
                                    borderRadius: 1.5,
                                    bgcolor: 'background.paper'
                                  }}
                                >
                                  <Typography variant="body2">
                                    {invoice.notes}
                                  </Typography>
                                </Paper>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            '& .MuiToolbar-root': {
              height: 56
            }
          }}
        />
      </CardContent>
    </Card>
  );
};

export default InvoiceAdmin; 