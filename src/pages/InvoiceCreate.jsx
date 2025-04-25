import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import InvoiceForm from '../components/invoice/InvoiceForm';

const InvoiceCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.invoices);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Handle form submission
  const handleSubmit = async (formData, invoiceId) => {
    try {
      // In a real app, you would dispatch an action to create the invoice
      // For now, we'll just simulate a successful creation
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'Invoice created successfully!',
          severity: 'success'
        });
        
        // Redirect to invoice list after a short delay
        setTimeout(() => {
          navigate('/invoices');
        }, 1500);
      }, 1000);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create invoice. Please try again.',
        severity: 'error'
      });
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
    </Box>
  );
};

export default InvoiceCreate; 