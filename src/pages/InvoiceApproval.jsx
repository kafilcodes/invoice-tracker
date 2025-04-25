import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  TablePagination
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Paid as PaidIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Mock data for demo purposes - replace with actual Redux actions in production
const mockInvoices = [
  {
    _id: '1',
    vendorName: 'Acme Corp',
    invoiceNumber: 'INV-2023-001',
    amount: 2500.00,
    dueDate: new Date('2023-12-15'),
    createdAt: new Date('2023-11-15'),
    status: 'pending',
    category: 'Office Supplies',
    submittedBy: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    _id: '2',
    vendorName: 'Tech Solutions',
    invoiceNumber: 'INV-2023-002',
    amount: 4750.50,
    dueDate: new Date('2023-12-20'),
    createdAt: new Date('2023-11-18'),
    status: 'pending',
    category: 'Software/SaaS',
    submittedBy: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  },
  {
    _id: '3',
    vendorName: 'Office Supplies Inc',
    invoiceNumber: 'INV-2023-003',
    amount: 850.25,
    dueDate: new Date('2023-12-10'),
    createdAt: new Date('2023-11-10'),
    status: 'pending',
    category: 'Office Supplies',
    submittedBy: {
      name: 'Robert Johnson',
      email: 'robert@example.com'
    }
  },
  {
    _id: '4',
    vendorName: 'Marketing Pros',
    invoiceNumber: 'INV-2023-004',
    amount: 3200.00,
    dueDate: new Date('2023-12-25'),
    createdAt: new Date('2023-11-20'),
    status: 'approved',
    category: 'Marketing',
    submittedBy: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    approvedBy: {
      name: 'Current User',
      email: 'reviewer@example.com'
    },
    approvedAt: new Date('2023-11-22')
  },
  {
    _id: '5',
    vendorName: 'Consulting Group',
    invoiceNumber: 'INV-2023-005',
    amount: 5000.00,
    dueDate: new Date('2023-12-30'),
    createdAt: new Date('2023-11-25'),
    status: 'rejected',
    category: 'Consulting',
    submittedBy: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    rejectedBy: {
      name: 'Current User',
      email: 'reviewer@example.com'
    },
    rejectedAt: new Date('2023-11-26'),
    rejectReason: 'Incomplete documentation'
  }
];

const InvoiceApproval = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Simulate API call to load invoices
  const loadInvoices = async () => {
    setLoading(true);
    try {
      // In a real app, you would dispatch a Redux action here
      // For now, we'll use mock data
      setTimeout(() => {
        setInvoices(mockInvoices);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };

  // Handle view invoice details
  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  // Handle approve dialog open
  const handleApproveDialogOpen = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenApproveDialog(true);
  };

  // Handle approve dialog close
  const handleApproveDialogClose = () => {
    setOpenApproveDialog(false);
    setSelectedInvoice(null);
  };

  // Handle approve invoice
  const handleApproveInvoice = () => {
    // In a real app, you would dispatch a Redux action here
    // For now, we'll update the local state
    const updatedInvoices = invoices.map(invoice => 
      invoice._id === selectedInvoice._id 
        ? { 
            ...invoice, 
            status: 'approved',
            approvedBy: { name: user?.name, email: user?.email },
            approvedAt: new Date()
          } 
        : invoice
    );
    setInvoices(updatedInvoices);
    handleApproveDialogClose();
  };

  // Handle reject dialog open
  const handleRejectDialogOpen = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenRejectDialog(true);
  };

  // Handle reject dialog close
  const handleRejectDialogClose = () => {
    setOpenRejectDialog(false);
    setSelectedInvoice(null);
    setRejectReason('');
  };

  // Handle reject invoice
  const handleRejectInvoice = () => {
    // In a real app, you would dispatch a Redux action here
    // For now, we'll update the local state
    const updatedInvoices = invoices.map(invoice => 
      invoice._id === selectedInvoice._id 
        ? { 
            ...invoice, 
            status: 'rejected',
            rejectedBy: { name: user?.name, email: user?.email },
            rejectedAt: new Date(),
            rejectReason
          } 
        : invoice
    );
    setInvoices(updatedInvoices);
    handleRejectDialogClose();
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
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

  // Filter invoices based on tab and search
  const getFilteredInvoices = () => {
    let filtered = [...invoices];
    
    // Filter by tab
    if (tabValue === 0) {
      filtered = filtered.filter(invoice => invoice.status === 'pending');
    } else if (tabValue === 1) {
      filtered = filtered.filter(invoice => invoice.status === 'approved');
    } else if (tabValue === 2) {
      filtered = filtered.filter(invoice => invoice.status === 'rejected');
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.vendorName.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.category.toLowerCase().includes(query) ||
        invoice.submittedBy.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredInvoices = getFilteredInvoices();
  
  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip size="small" label="Pending" color="warning" />;
      case 'approved':
        return <Chip size="small" label="Approved" color="success" icon={<ApproveIcon />} />;
      case 'rejected':
        return <Chip size="small" label="Rejected" color="error" icon={<RejectIcon />} />;
      case 'paid':
        return <Chip size="small" label="Paid" color="info" icon={<PaidIcon />} />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Invoice Approvals
      </Typography>
      
      <Paper elevation={2} sx={{ borderRadius: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Pending" />
            <Tab label="Approved" />
            <Tab label="Rejected" />
          </Tabs>
          
          <TextField
            placeholder="Search invoices..."
            variant="outlined"
            size="small"
            sx={{ width: 300 }}
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Submitted By</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No invoices found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((invoice) => (
                        <TableRow key={invoice._id} hover>
                          <TableCell>{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.vendorName}</TableCell>
                          <TableCell>${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{invoice.submittedBy.name}</TableCell>
                          <TableCell>{invoice.category}</TableCell>
                          <TableCell>{getStatusChip(invoice.status)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewInvoice(invoice._id)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {invoice.status === 'pending' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApproveDialogOpen(invoice)}
                                  >
                                    <ApproveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRejectDialogOpen(invoice)}
                                  >
                                    <RejectIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Approve Dialog */}
      <Dialog
        open={openApproveDialog}
        onClose={handleApproveDialogClose}
      >
        <DialogTitle>Approve Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to approve the invoice <strong>{selectedInvoice?.invoiceNumber}</strong> from <strong>{selectedInvoice?.vendorName}</strong> for <strong>${selectedInvoice?.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApproveDialogClose}>Cancel</Button>
          <Button onClick={handleApproveInvoice} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={handleRejectDialogClose}
      >
        <DialogTitle>Reject Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting the invoice <strong>{selectedInvoice?.invoiceNumber}</strong> from <strong>{selectedInvoice?.vendorName}</strong>.
          </DialogContentText>
          <TextField
            autoFocus
            label="Reason for Rejection"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectDialogClose}>Cancel</Button>
          <Button onClick={handleRejectInvoice} color="error" variant="contained" disabled={!rejectReason.trim()}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceApproval; 