import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Link,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  AttachFile,
  CheckCircle,
  Edit,
  FileDownload,
  History,
  MoneyOff,
  Cancel,
  Paid,
  PendingActions,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  getInvoiceById,
  updateInvoiceStatus,
  uploadInvoiceAttachment,
} from '../redux/slices/invoiceSlice';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentInvoice, loading, error } = useSelector((state) => state.invoices);
  const { user } = useSelector((state) => state.auth);

  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [fileUpload, setFileUpload] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(getInvoiceById(id));
    }
  }, [dispatch, id]);

  const handleStatusChange = (newStatus) => {
    setStatusToUpdate(newStatus);
    setOpenStatusDialog(true);
  };

  const handleConfirmStatusChange = () => {
    const statusData = {
      status: statusToUpdate,
      ...(statusToUpdate === 'rejected' && { rejectReason }),
    };

    dispatch(updateInvoiceStatus({ id, statusData }))
      .unwrap()
      .then(() => {
        setSnackbar({
          open: true,
          message: `Invoice has been ${statusToUpdate} successfully`,
          severity: 'success',
        });
        setOpenStatusDialog(false);
        setRejectReason('');
      })
      .catch((err) => {
        setSnackbar({
          open: true,
          message: err.message || 'Failed to update status',
          severity: 'error',
        });
      });
  };

  const handleFileChange = (e) => {
    setFileUpload(e.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!fileUpload) return;

    const formData = new FormData();
    formData.append('file', fileUpload);

    dispatch(uploadInvoiceAttachment({ id, formData }))
      .unwrap()
      .then(() => {
        setSnackbar({
          open: true,
          message: 'File uploaded successfully',
          severity: 'success',
        });
        setFileUpload(null);
      })
      .catch((err) => {
        setSnackbar({
          open: true,
          message: err.message || 'Failed to upload file',
          severity: 'error',
        });
      });
  };

  const getStatusChip = (status) => {
    let icon;
    let color;

    switch (status) {
      case 'pending':
        icon = <PendingActions />;
        color = 'warning';
        break;
      case 'approved':
        icon = <CheckCircle />;
        color = 'success';
        break;
      case 'rejected':
        icon = <Cancel />;
        color = 'error';
        break;
      case 'paid':
        icon = <Paid />;
        color = 'info';
        break;
      default:
        icon = <PendingActions />;
        color = 'default';
    }

    return (
      <Chip
        icon={icon}
        label={status.charAt(0).toUpperCase() + status.slice(1)}
        color={color}
        size="medium"
      />
    );
  };

  // Determine which actions are available based on current status and user role
  const getAvailableActions = () => {
    if (!user || !currentInvoice) return [];

    const actions = [];

    if (user.role === 'admin') {
      if (currentInvoice.status === 'pending') {
        actions.push({
          label: 'Approve',
          action: () => handleStatusChange('approved'),
          icon: <CheckCircle />,
          color: 'success',
        });
        actions.push({
          label: 'Reject',
          action: () => handleStatusChange('rejected'),
          icon: <Cancel />,
          color: 'error',
        });
      }
      
      if (currentInvoice.status === 'approved') {
        actions.push({
          label: 'Mark as Paid',
          action: () => handleStatusChange('paid'),
          icon: <Paid />,
          color: 'info',
        });
      }
    }

    if (user.role === 'finance' && currentInvoice.status === 'approved') {
      actions.push({
        label: 'Mark as Paid',
        action: () => handleStatusChange('paid'),
        icon: <Paid />,
        color: 'info',
      });
    }

    // Anyone can edit their own invoices if still pending
    if (
      user._id === currentInvoice.createdBy &&
      currentInvoice.status === 'pending'
    ) {
      actions.push({
        label: 'Edit',
        action: () => navigate(`/invoices/edit/${id}`),
        icon: <Edit />,
        color: 'primary',
      });
    }

    return actions;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading invoice details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentInvoice) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Invoice not found</Alert>
      </Box>
    );
  }

  const {
    invoiceNumber,
    vendorName,
    vendorAddress,
    amount,
    description,
    status,
    dueDate,
    createdAt,
    items = [],
    attachments = [],
    history = [],
    rejectReason: currentRejectReason,
  } = currentInvoice;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/invoices')}
          sx={{ mb: 2 }}
        >
          Back to Invoices
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Invoice #{invoiceNumber}
          </Typography>
          <Box>{getStatusChip(status)}</Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Invoice Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vendor
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {vendorName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    ${amount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {format(new Date(createdAt), 'MMMM d, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {format(new Date(dueDate), 'MMMM d, yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vendor Address
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {vendorAddress || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {description || 'N/A'}
                  </Typography>
                </Grid>

                {status === 'rejected' && currentRejectReason && (
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Rejection Reason:</Typography>
                      <Typography variant="body2">{currentRejectReason}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {items && items.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Line Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitPrice?.toLocaleString()}</TableCell>
                          <TableCell align="right">
                            ${(item.quantity * item.unitPrice)?.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                          Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${amount?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {getAvailableActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="contained"
                    color={action.color}
                    startIcon={action.icon}
                    onClick={action.action}
                    fullWidth
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Attachments
              </Typography>
              {attachments && attachments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {attachments.map((attachment, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachFile sx={{ mr: 1 }} />
                        <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                          {attachment.filename}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<FileDownload />}
                        component={Link}
                        href={attachment.url}
                        target="_blank"
                      >
                        View
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No attachments
                </Typography>
              )}

              {(user.role === 'admin' || user._id === currentInvoice.createdBy) && (
                <Box sx={{ mt: 2 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Upload New Attachment
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button variant="outlined" component="label">
                      Choose File
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>
                    <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                      {fileUpload ? fileUpload.name : 'No file selected'}
                    </Typography>
                  </Box>
                  {fileUpload && (
                    <Button
                      variant="contained"
                      onClick={handleFileUpload}
                      sx={{ mt: 1 }}
                      fullWidth
                    >
                      Upload
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {history && history.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <History sx={{ mr: 1 }} />
                  History
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {history.map((event, index) => (
                    <Box key={index}>
                      <Typography variant="subtitle2">
                        {event.action}
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Typography>
                      <Typography variant="body2">
                        By: {event.user ? event.user.name : 'System'}
                      </Typography>
                      {event.note && (
                        <Typography variant="body2" color="text.secondary">
                          Note: {event.note}
                        </Typography>
                      )}
                      {index < history.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>
          {`Confirm ${
            statusToUpdate.charAt(0).toUpperCase() + statusToUpdate.slice(1)
          }`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {statusToUpdate === 'approved'
              ? 'Are you sure you want to approve this invoice?'
              : statusToUpdate === 'rejected'
              ? 'Please provide a reason for rejecting this invoice:'
              : statusToUpdate === 'paid'
              ? 'Are you sure you want to mark this invoice as paid?'
              : 'Are you sure you want to update the status of this invoice?'}
          </DialogContentText>
          {statusToUpdate === 'rejected' && (
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason"
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmStatusChange}
            color={
              statusToUpdate === 'approved'
                ? 'success'
                : statusToUpdate === 'rejected'
                ? 'error'
                : 'primary'
            }
            variant="contained"
            disabled={statusToUpdate === 'rejected' && !rejectReason}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvoiceDetail; 