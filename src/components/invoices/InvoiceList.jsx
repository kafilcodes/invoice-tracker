import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../../redux/slices/invoiceSlice';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

const InvoiceList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { invoices: invoiceData, loading, total } = useSelector((state) => state.invoices);
  const organizationName = user?.organization || '';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  
  // Fetch invoices on initial load and when filters change
  useEffect(() => {
    if (!organizationName) return;
    
    fetchInvoices();
  }, [organizationName, statusFilter, sortField, sortDirection, page, rowsPerPage, dispatch]);
  
  // Fetch invoices using Redux
  const fetchInvoices = async () => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      sortField,
      sortDirection,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined
    };
    
    dispatch(getInvoices(params));
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search
  const handleApplySearch = () => {
    setPage(0);
    fetchInvoices();
  };
  
  // Handle search key press (Enter)
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplySearch();
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };
  
  // Handle sort field change
  const handleSortFieldChange = (e) => {
    setSortField(e.target.value);
    setPage(0);
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    setPage(0);
  };
  
  // Get status chip based on status
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Chip 
            icon={<ApprovedIcon />} 
            label="Approved" 
            color="success" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'rejected':
        return (
          <Chip 
            icon={<RejectedIcon />} 
            label="Rejected" 
            color="error" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'pending':
        return (
          <Chip 
            icon={<PendingIcon />} 
            label="Pending" 
            color="warning" 
            size="small" 
            variant="outlined" 
          />
        );
      case 'draft':
        return (
          <Chip 
            label="Draft" 
            color="default" 
            size="small" 
            variant="outlined" 
          />
        );
      default:
        return (
          <Chip 
            label={status || 'Unknown'} 
            size="small" 
            variant="outlined" 
          />
        );
    }
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
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // View invoice
  const viewInvoice = (id) => {
    navigate(`/invoices/${id}`);
  };
  
  // Edit invoice
  const editInvoice = (id) => {
    navigate(`/invoices/${id}/edit`);
  };
  
  // Delete invoice
  const deleteInvoice = (id) => {
    // This function would be implemented later with a confirmation dialog
    console.log('Delete invoice:', id);
  };
  
  // Create new invoice
  const createInvoice = () => {
    navigate('/invoices/create');
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, md: 3 } }}>
      <Card sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h5" component="h1" fontWeight="bold" color="primary.main">
              Invoices
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={createInvoice}
              sx={{ 
                borderRadius: 2, 
                px: 3, 
                py: 1, 
                fontWeight: 'bold',
                boxShadow: 2
              }}
            >
              New Invoice
            </Button>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleApplySearch}>
                        <FilterIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
                sx={{ maxWidth: '100%' }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortField}
                    label="Sort By"
                    onChange={handleSortFieldChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="createdAt">Date Created</MenuItem>
                    <MenuItem value="invoiceDate">Invoice Date</MenuItem>
                    <MenuItem value="dueDate">Due Date</MenuItem>
                    <MenuItem value="amount">Amount</MenuItem>
                    <MenuItem value="vendorName">Vendor</MenuItem>
                  </Select>
                </FormControl>
                
                <IconButton 
                  onClick={toggleSortDirection}
                  color="primary"
                  sx={{ 
                    transform: sortDirection === 'asc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                >
                  <SortIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
          
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'primary.light' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : invoiceData && invoiceData.length > 0 ? (
                    invoiceData.map((invoice) => (
                      <TableRow 
                        key={invoice.id || invoice._id}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'action.hover',
                            cursor: 'pointer'
                          }
                        }}
                        onClick={() => viewInvoice(invoice.id || invoice._id)}
                      >
                        <TableCell>{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.vendorName}</TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell>{getStatusChip(invoice.status)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewInvoice(invoice.id || invoice._id);
                                }}
                                sx={{ 
                                  bgcolor: 'primary.light', 
                                  color: 'primary.contrastText',
                                  '&:hover': { bgcolor: 'primary.main' }
                                }}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editInvoice(invoice.id || invoice._id);
                                }}
                                sx={{ 
                                  bgcolor: 'info.light', 
                                  color: 'info.contrastText',
                                  '&:hover': { bgcolor: 'info.main' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteInvoice(invoice.id || invoice._id);
                                }}
                                sx={{ 
                                  bgcolor: 'error.light', 
                                  color: 'error.contrastText',
                                  '&:hover': { bgcolor: 'error.main' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No invoices found
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<AddIcon />}
                          onClick={createInvoice}
                          sx={{ mt: 2, borderRadius: 2 }}
                        >
                          Create your first invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={total || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceList; 