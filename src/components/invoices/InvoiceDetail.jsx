import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getInvoiceById, updateInvoiceStatus } from '../../redux/slices/invoiceSlice';
import { logActivity, ACTIVITY_TYPES } from '../../utils/activityLogger';
import { format } from 'date-fns';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  PictureAsPdf,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  AttachFile,
  Description
} from '@mui/icons-material';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentInvoice: invoice, loading, error: invoiceError } = useSelector((state) => state.invoices);
  const organizationName = user?.organization || '';

  const [error, setError] = useState('');
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch invoice data
  useEffect(() => {
    if (!id || !organizationName) return;
    
    dispatch(getInvoiceById(id));
  }, [id, organizationName, dispatch]);
  
  useEffect(() => {
    if (invoiceError) {
      setError(invoiceError);
    }
  }, [invoiceError]);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle ISO date strings
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format currency helper
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Open status change dialog
  const handleStatusChange = (status) => {
    setNewStatus(status);
    setStatusNote('');
    setStatusDialog(true);
  };

  // Close status dialog
  const handleCloseDialog = () => {
    setStatusDialog(false);
  };

  // Submit status change
  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    
    try {
      setUpdatingStatus(true);
      
      // Update invoice status using Redux thunk
      await dispatch(updateInvoiceStatus({
        invoiceId: id,
        status: newStatus,
        note: statusNote
      })).unwrap();
      
      setStatusDialog(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update invoice status: ' + (err.message || 'Unknown error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Navigate to edit page
  const handleEdit = () => {
    navigate(`/invoices/${id}/edit`);
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckCircle />} label="Approved" color="success" />;
      case 'rejected':
        return <Chip icon={<Cancel />} label="Rejected" color="error" />;
      case 'pending':
        return <Chip icon={<HourglassEmpty />} label="Pending" color="warning" />;
      case 'draft':
        return <Chip label="Draft" color="default" />;
      default:
        return <Chip label={status || 'Unknown'} />;
    }
  };

  // Download/view attachment
  const handleViewAttachment = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Alert severity="warning">Invoice not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={handleEdit}
            sx={{ mr: 2 }}
          >
            Edit
          </Button>
          
          {/* Status Actions */}
          {invoice.status !== 'approved' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleStatusChange('approved')}
              sx={{ mr: 1 }}
            >
              Approve
            </Button>
          )}
          
          {invoice.status !== 'rejected' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              onClick={() => handleStatusChange('rejected')}
            >
              Reject
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Invoice Details */}
      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">
                  Invoice #{invoice.invoiceNumber}
                </Typography>
                {getStatusChip(invoice.status)}
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" variant="head" width="25%">Vendor</TableCell>
                      <TableCell>{invoice.vendorName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" variant="head">Amount</TableCell>
                      <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" variant="head">Invoice Date</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" variant="head">Due Date</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    </TableRow>
                    {invoice.description && (
                      <TableRow>
                        <TableCell component="th" variant="head">Description</TableCell>
                        <TableCell>{invoice.description}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell component="th" variant="head">Created by</TableCell>
                      <TableCell>
                        {invoice.createdBy?.name || invoice.createdBy?.email || 'Unknown'}
                        {invoice.createdAt && ` on ${formatDate(invoice.createdAt)}`}
                      </TableCell>
                    </TableRow>
                    {invoice.statusUpdatedBy && (
                      <TableRow>
                        <TableCell component="th" variant="head">Status updated by</TableCell>
                        <TableCell>
                          {invoice.statusUpdatedBy.name || invoice.statusUpdatedBy.email}
                          {invoice.statusUpdatedAt && ` on ${formatDate(invoice.statusUpdatedAt)}`}
                        </TableCell>
                      </TableRow>
                    )}
                    {invoice.statusNote && (
                      <TableRow>
                        <TableCell component="th" variant="head">Status note</TableCell>
                        <TableCell>{invoice.statusNote}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reviewers */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reviewers
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {invoice.reviewers && invoice.reviewers.length > 0 ? (
                <List dense>
                  {invoice.reviewers.map((reviewer, index) => (
                    <ListItem key={index} divider={index < invoice.reviewers.length - 1}>
                      <ListItemText
                        primary={reviewer.name || reviewer.email}
                        secondary={reviewer.status}
                      />
                      {reviewer.status === 'approved' && (
                        <Chip 
                          size="small" 
                          color="success" 
                          icon={<CheckCircle />} 
                          label="Approved" 
                        />
                      )}
                      {reviewer.status === 'rejected' && (
                        <Chip 
                          size="small" 
                          color="error" 
                          icon={<Cancel />} 
                          label="Rejected" 
                        />
                      )}
                      {reviewer.status === 'pending' && (
                        <Chip 
                          size="small" 
                          color="warning" 
                          icon={<HourglassEmpty />} 
                          label="Pending" 
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviewers assigned
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Attachments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {invoice.attachments && invoice.attachments.length > 0 ? (
                <List dense>
                  {invoice.attachments.map((file, index) => (
                    <ListItem
                      key={index}
                      divider={index < invoice.attachments.length - 1}
                      secondaryAction={
                        <Tooltip title="View/Download">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleViewAttachment(file.url)}
                          >
                            {file.type && file.type.includes('pdf') ? (
                              <PictureAsPdf color="error" />
                            ) : file.type && file.type.includes('image') ? (
                              <AttachFile color="primary" />
                            ) : (
                              <Description color="action" />
                            )}
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={file.size ? `${Math.round(file.size / 1024)} KB` : ''}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No attachments
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Custom Fields */}
        {invoice.customFields && invoice.customFields.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Custom Fields
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {invoice.customFields.map((field, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {field.name}
                        </Typography>
                        <Typography variant="body1">
                          {field.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* Notes */}
        {invoice.notes && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  {invoice.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      
      {/* Status Change Dialog */}
      <Dialog open={statusDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {newStatus === 'approved' ? 'Approve Invoice' : 'Reject Invoice'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {newStatus === 'approved'
              ? 'Are you sure you want to approve this invoice?'
              : 'Are you sure you want to reject this invoice?'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Note (Optional)"
            fullWidth
            multiline
            rows={3}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateStatus}
            color={newStatus === 'approved' ? 'success' : 'error'}
            variant="contained"
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <CircularProgress size={24} />
            ) : newStatus === 'approved' ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDetail; 