import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
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
  Add as AddIcon,
  ArrowBack,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  createInvoice,
  getInvoiceById,
  updateInvoice,
} from '../redux/slices/invoiceSlice';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);

  const { currentInvoice, loading, error } = useSelector((state) => state.invoices);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorName: '',
    vendorAddress: '',
    amount: '',
    description: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    items: [],
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [itemForm, setItemForm] = useState({
    description: '',
    quantity: '',
    unitPrice: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      dispatch(getInvoiceById(id));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    // Populate form with invoice data when editing
    if (isEditMode && currentInvoice) {
      setFormData({
        invoiceNumber: currentInvoice.invoiceNumber || '',
        vendorName: currentInvoice.vendorName || '',
        vendorAddress: currentInvoice.vendorAddress || '',
        amount: currentInvoice.amount?.toString() || '',
        description: currentInvoice.description || '',
        dueDate: currentInvoice.dueDate ? new Date(currentInvoice.dueDate) : new Date(),
        items: currentInvoice.items || [],
      });
    }
  }, [currentInvoice, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
  };

  const handleDueDateChange = (e) => {
    setFormData({
      ...formData,
      dueDate: new Date(e.target.value),
    });
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm({
      ...itemForm,
      [name]: value,
    });
  };

  const addItem = () => {
    // Validate item form
    const errors = {};
    if (!itemForm.description) errors.itemDescription = 'Description is required';
    if (!itemForm.quantity || itemForm.quantity <= 0)
      errors.itemQuantity = 'Quantity must be greater than 0';
    if (!itemForm.unitPrice || itemForm.unitPrice <= 0)
      errors.itemUnitPrice = 'Unit price must be greater than 0';

    if (Object.keys(errors).length > 0) {
      setValidationErrors({ ...validationErrors, ...errors });
      return;
    }

    const newItem = {
      description: itemForm.description,
      quantity: parseFloat(itemForm.quantity),
      unitPrice: parseFloat(itemForm.unitPrice),
    };

    const updatedItems = [...formData.items, newItem];
    
    // Calculate new total amount
    const newAmount = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      amount: newAmount.toString(),
    });

    // Reset item form
    setItemForm({
      description: '',
      quantity: '',
      unitPrice: '',
    });
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // Recalculate total amount
    const newAmount = updatedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    setFormData({
      ...formData,
      items: updatedItems,
      amount: newAmount.toString(),
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.invoiceNumber) errors.invoiceNumber = 'Invoice number is required';
    if (!formData.vendorName) errors.vendorName = 'Vendor name is required';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    
    // For edit mode, we might have preset amount, but for new invoices
    // we should check if there are items or a manually set amount
    if (!isEditMode && formData.items.length === 0 && !formData.amount) {
      errors.items = 'At least one item is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors',
        severity: 'error',
      });
      return;
    }

    // Prepare data for submission
    const invoiceData = {
      ...formData,
      amount: parseFloat(formData.amount),
      items: formData.items.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      })),
    };

    const action = isEditMode
      ? updateInvoice({ id, invoiceData })
      : createInvoice(invoiceData);

    dispatch(action)
      .unwrap()
      .then(() => {
        setSnackbar({
          open: true,
          message: `Invoice ${isEditMode ? 'updated' : 'created'} successfully`,
          severity: 'success',
        });
        setTimeout(() => {
          navigate(isEditMode ? `/invoices/${id}` : '/invoices');
        }, 1500);
      })
      .catch((err) => {
        setSnackbar({
          open: true,
          message: err.message || `Failed to ${isEditMode ? 'update' : 'create'} invoice`,
          severity: 'error',
        });
      });
  };

  if (isEditMode && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading invoice details...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Invoice Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    required
                    error={!!validationErrors.invoiceNumber}
                    helperText={validationErrors.invoiceNumber}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Due Date"
                    type="date"
                    fullWidth
                    required
                    value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
                    onChange={handleDueDateChange}
                    error={!!validationErrors.dueDate}
                    helperText={validationErrors.dueDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vendor Name"
                    name="vendorName"
                    value={formData.vendorName}
                    onChange={handleInputChange}
                    required
                    error={!!validationErrors.vendorName}
                    helperText={validationErrors.vendorName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vendor Address"
                    name="vendorAddress"
                    value={formData.vendorAddress}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Total Amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      readOnly: formData.items.length > 0,
                    }}
                    helperText={
                      formData.items.length > 0
                        ? 'Amount is calculated from line items'
                        : 'Or add line items below to calculate automatically'
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Line Items
              </Typography>
              
              {validationErrors.items && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationErrors.items}
                </Alert>
              )}

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell width="50px"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${parseFloat(item.unitPrice).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {formData.items.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                          Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${parseFloat(formData.amount).toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                    {formData.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No items added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Add New Item
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={itemForm.description}
                    onChange={handleItemChange}
                    error={!!validationErrors.itemDescription}
                    helperText={validationErrors.itemDescription}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={itemForm.quantity}
                    onChange={handleItemChange}
                    error={!!validationErrors.itemQuantity}
                    helperText={validationErrors.itemQuantity}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Unit Price"
                    name="unitPrice"
                    type="number"
                    value={itemForm.unitPrice}
                    onChange={handleItemChange}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    error={!!validationErrors.itemUnitPrice}
                    helperText={validationErrors.itemUnitPrice}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    fullWidth
                    sx={{ height: '100%' }}
                  >
                    Add Item
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                type="submit"
                fullWidth
                size="large"
              >
                {isEditMode ? 'Update Invoice' : 'Create Invoice'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate(-1)}
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default InvoiceForm; 