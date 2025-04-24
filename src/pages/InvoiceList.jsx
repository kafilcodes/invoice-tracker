import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  FilterList,
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  Paid,
  PendingActions,
  Edit,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getInvoices } from '../redux/slices/invoiceSlice';

const InvoiceList = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { invoices, total, loading } = useSelector((state) => state.invoices);
  const { user } = useSelector((state) => state.auth);

  // Parse query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const statusFromUrl = queryParams.get('status') || '';

  // Filter and sort state
  const [filters, setFilters] = useState({
    search: '',
    status: statusFromUrl,
    date: '',
  });
  const [sort, setSort] = useState({
    field: 'createdAt',
    direction: 'desc',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  // Initial data fetch
  useEffect(() => {
    const queryParams = {
      page,
      limit,
      sortField: sort.field,
      sortDirection: sort.direction,
      ...filters,
    };
    dispatch(getInvoices(queryParams));
  }, [dispatch, page, sort, filters]);

  // Update URL when status filter changes
  useEffect(() => {
    if (filters.status) {
      navigate(`/invoices?status=${filters.status}`, { replace: true });
    } else if (statusFromUrl) {
      navigate('/invoices', { replace: true });
    }
  }, [filters.status, navigate, statusFromUrl]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    const isAsc = sort.field === field && sort.direction === 'asc';
    setSort({
      field,
      direction: isAsc ? 'desc' : 'asc',
    });
    setPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      date: '',
    });
    setPage(1);
    navigate('/invoices', { replace: true });
  };

  // Handle pagination change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Get appropriate chip color based on status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'warning',
          icon: <PendingActions fontSize="small" />,
        };
      case 'approved':
        return {
          color: 'success',
          icon: <CheckCircle fontSize="small" />,
        };
      case 'rejected':
        return {
          color: 'error',
          icon: <Cancel fontSize="small" />,
        };
      case 'paid':
        return {
          color: 'info',
          icon: <Paid fontSize="small" />,
        };
      default:
        return {
          color: 'default',
          icon: null,
        };
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Invoices
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={RouterLink}
          to="/invoices/create"
        >
          Create Invoice
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by invoice number, vendor, or description"
                value={filters.search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {showFilters && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="month"
                  label="Month"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'invoiceNumber'}
                  direction={
                    sort.field === 'invoiceNumber' ? sort.direction : 'asc'
                  }
                  onClick={() => handleSortChange('invoiceNumber')}
                >
                  Invoice #
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'vendorName'}
                  direction={
                    sort.field === 'vendorName' ? sort.direction : 'asc'
                  }
                  onClick={() => handleSortChange('vendorName')}
                >
                  Vendor
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'amount'}
                  direction={sort.field === 'amount' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'status'}
                  direction={sort.field === 'status' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'dueDate'}
                  direction={sort.field === 'dueDate' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('dueDate')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sort.field === 'createdAt'}
                  direction={sort.field === 'createdAt' ? sort.direction : 'asc'}
                  onClick={() => handleSortChange('createdAt')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : invoices && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices && invoices.map((invoice) => {
                const statusInfo = getStatusInfo(invoice.status);
                return (
                  <TableRow key={invoice._id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.vendorName}</TableCell>
                    <TableCell>${invoice.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        color={statusInfo.color}
                        size="small"
                        icon={statusInfo.icon}
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate && format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {invoice.createdAt && format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            component={RouterLink}
                            to={`/invoices/${invoice._id}`}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {invoice.status === 'pending' && (
                          <Tooltip title="Edit">
                            <IconButton
                              component={RouterLink}
                              to={`/invoices/edit/${invoice._id}`}
                              size="small"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {invoices && invoices.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default InvoiceList; 