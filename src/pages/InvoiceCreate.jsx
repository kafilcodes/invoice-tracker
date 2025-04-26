import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, CircularProgress, Backdrop } from '@mui/material';
import InvoiceForm from '../components/invoice/InvoiceForm';
import { createInvoice, resetInvoiceState } from '../redux/slices/invoiceSlice';

const InvoiceCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.invoices);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [processingState, setProcessingState] = useState('');

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      console.log('[INVOKE] Starting invoice creation process');
      setProcessingState('Preparing invoice data...');
      
      // Dispatch the createInvoice action with the form data
      const resultAction = await dispatch(createInvoice({
        ...formData,
        // Ensure all required fields are present
        invoiceNumber: formData.invoiceNumber,
        vendorName: formData.vendorName,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        issueDate: formData.issueDate instanceof Date ? formData.issueDate.toISOString() : formData.issueDate,
        dueDate: formData.dueDate instanceof Date ? formData.dueDate.toISOString() : formData.dueDate,
        category: formData.category,
        notes: formData.notes || '',
        attachments: formData.attachments || []
      }));
      
      // Check if the action was fulfilled or rejected
      if (createInvoice.fulfilled.match(resultAction)) {
        console.log('[SUCCESS] Invoice created successfully:', resultAction.payload);
        setSnackbar({
          open: true,
          message: 'Invoice created successfully!',
          severity: 'success'
        });
        
        // Reset the invoice state
        setTimeout(() => {
          dispatch(resetInvoiceState());
          
          // Redirect to invoice list after a short delay
          navigate('/invoices');
        }, 1500);
      } else if (createInvoice.rejected.match(resultAction)) {
        console.error('[ERROR] Invoice creation failed:', resultAction.error);
        setSnackbar({
          open: true,
          message: `Failed to create invoice: ${resultAction.payload || resultAction.error.message || 'Unknown error'}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('[FATAL] Error in invoice creation process:', error);
      setSnackbar({
        open: true,
        message: `Unexpected error: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setProcessingState('');
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Create New Invoice
      </Typography>
      
      <InvoiceForm
        onSubmit={handleSubmit}
        isLoading={loading}
        title="Create New Invoice"
      />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body1">{processingState || 'Processing...'}</Typography>
      </Backdrop>
    </Box>
  );
};

export default InvoiceCreate; 