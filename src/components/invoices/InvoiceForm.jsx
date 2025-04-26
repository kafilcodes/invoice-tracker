import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { rtdb } from '../../firebase/config';
import { ref as dbRef, get, update, push, child, set } from 'firebase/database';
import { Box, Button, Card, CardContent, Divider, FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography, IconButton, Alert, CircularProgress } from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { logActivity, ACTIVITY_TYPES } from '../../utils/activityLogger';
import FileUploader from '../common/FileUploader';
import { v4 as uuidv4 } from 'uuid';
import { createInvoice, updateInvoice } from '../../redux/slices/invoiceSlice';
import { toast } from 'react-hot-toast';

// Helper function to upload multiple files to Firebase Storage
const uploadMultipleFiles = async (files, basePath, options = {}) => {
  const { onProgress, validationOptions = {} } = options;
  const storage = getStorage();
  const uploadPromises = [];
  const uploadResults = [];
  
  // Validate files if validation options provided
  if (validationOptions) {
    const { maxSizeMB = 10, allowedTypes = [] } = validationOptions;
    
    for (const file of files) {
      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (maxSizeMB && fileSizeMB > maxSizeMB) {
        throw new Error(`File ${file.name} exceeds maximum size of ${maxSizeMB}MB`);
      }
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed for ${file.name}`);
      }
    }
  }
  
  // Upload each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const filePath = `${basePath}/${fileName}`;
    const storageRef = ref(storage, filePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Create a promise for this upload
    const uploadPromise = new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            // Calculate overall progress across all files
            const overallProgress = Math.round((i + progress / 100) / files.length * 100);
            onProgress(overallProgress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const fileData = {
              name: file.name,
              path: filePath,
              url: downloadURL,
              type: file.type,
              size: file.size,
              createdAt: new Date().toISOString()
            };
            
            resolve(fileData);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
    uploadPromises.push(uploadPromise);
  }
  
  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);
  return results;
};

const initialFormState = {
  invoiceNumber: '',
  invoiceDate: new Date(),
  dueDate: null,
  amount: '',
  currency: 'USD',
  vendorName: '',
  description: '',
  status: 'pending',
  notes: '',
  customFields: [],
  attachments: []
};

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' }
];

const InvoiceForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [loading, setLoading] = useState(isEdit);
  
  const { user } = useSelector((state) => state.auth);
  const organizationName = user?.organization || '';
  
  // Fetch invoice data if in edit mode
  useEffect(() => {
    if (isEdit && id && organizationName) {
      const fetchInvoice = async () => {
        try {
          setLoading(true);
          // Use RTDB reference instead of Firestore
          const invoiceReference = dbRef(rtdb, `organizations/${organizationName}/invoices/${id}`);
          const snapshot = await get(invoiceReference);
          
          if (!snapshot.exists()) {
            setFormError('Invoice not found');
            return;
          }
          
          const invoiceData = snapshot.val();
          
          // Format the data for the form
          setForm({
            invoiceNumber: invoiceData.invoiceNumber || '',
            invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : new Date(),
            dueDate: invoiceData.dueDate ? new Date(invoiceData.dueDate) : null,
            amount: invoiceData.amount?.toString() || '',
            currency: invoiceData.currency || 'USD',
            vendorName: invoiceData.vendorName || '',
            description: invoiceData.description || '',
            status: invoiceData.status || 'pending',
            notes: invoiceData.notes || '',
            customFields: invoiceData.customFields || [],
            attachments: invoiceData.attachments || []
          });
        } catch (error) {
          console.error('Error fetching invoice:', error);
          setFormError('Failed to load invoice data');
        } finally {
          setLoading(false);
        }
      };
      
      fetchInvoice();
    } else {
      // Generate invoice number for new invoices
      if (organizationName) {
        const orgPrefix = organizationName
          ?.split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase() || 'INV';
        
        const uniqueId = Math.floor(100000 + Math.random() * 900000);
        setForm(prev => ({ ...prev, invoiceNumber: `${orgPrefix}-${uniqueId}` }));
      }
    }
  }, [isEdit, id, organizationName]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for the field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handle date changes
  const handleDateChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  // Add a custom field
  const handleAddCustomField = () => {
    if (!customFieldName.trim()) {
      setErrors((prev) => ({ ...prev, customFieldName: 'Field name is required' }));
      return;
    }
    
    setForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { id: uuidv4(), name: customFieldName.trim(), value: customFieldValue.trim() }
      ]
    }));
    
    // Reset inputs
    setCustomFieldName('');
    setCustomFieldValue('');
    setErrors((prev) => ({ ...prev, customFieldName: '' }));
  };
  
  // Remove a custom field
  const handleRemoveCustomField = (id) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== id)
    }));
  };
  
  // Handle file changes from FileUploader
  const handleFileChange = (files) => {
    console.log('Files selected:', files);
    if (!files || files.length === 0) return;

    // Store the actual File objects which will be uploaded
    const newAttachments = Array.from(files).map(file => file);
    
    // Update form state with file objects
    setForm(prev => ({
      ...prev,
      attachments: newAttachments
    }));
    
    console.log(`Added ${newAttachments.length} files to form data`);
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!form.invoiceNumber.trim()) newErrors.invoiceNumber = 'Invoice number is required';
    if (!form.invoiceDate) newErrors.invoiceDate = 'Invoice date is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!form.vendorName.trim()) newErrors.vendorName = 'Vendor name is required';
    
    // Notes character limit
    if (form.notes.length > 1000) {
      newErrors.notes = 'Notes must be less than 1000 characters';
    }
    
    // Validate date sequence
    if (form.invoiceDate && form.dueDate && form.dueDate < form.invoiceDate) {
      newErrors.dueDate = 'Due date cannot be before invoice date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError('');
    
    try {
      console.log('Submitting invoice form:', form);
      
      // Validate required fields
      if (!form.invoiceNumber || !form.amount || !form.dueDate) {
        setFormError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const payload = {
        ...form,
        // Keep the file objects in the attachments array for upload
        // No need to modify this, as we'll directly use the File objects
      };
      
      console.log('Prepared invoice payload:', payload);
      console.log('Attachment count:', (payload.attachments || []).length);
      
      // Create or update the invoice
      if (isEdit && id) {
        console.log(`Updating invoice ${id}`);
        const result = await dispatch(updateInvoice({ id, invoiceData: payload })).unwrap();
        console.log('Invoice updated successfully:', result);
        toast.success('Invoice updated successfully!');
      } else {
        console.log('Creating new invoice');
        const result = await dispatch(createInvoice(payload)).unwrap();
        console.log('Invoice created successfully:', result);
        toast.success('Invoice created successfully!');
      }
      
      // Navigate back to list view
      navigate('/invoices');
    } catch (err) {
      console.error('Error submitting invoice:', err);
      setFormError(err.message || 'Failed to save invoice');
      toast.error('Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Card elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 4,
            gap: 2
          }}>
            <Typography variant="h5" component="h1" fontWeight="bold" color="primary.main">
              {isEdit ? 'Edit Invoice' : 'Create New Invoice'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => isEdit ? navigate(`/invoices/${id}`) : navigate('/invoices')}
              size="medium"
              sx={{ 
                borderRadius: 1.5,
                px: 2,
                height: 40
              }}
            >
              {isEdit ? 'Back to Invoice' : 'Back to Invoices'}
            </Button>
          </Box>
          
          {formError && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 1.5 }}>
              {formError}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Invoice Information */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  bgcolor: 'background.paper', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    color="primary" 
                    fontWeight="medium" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 4,
                        height: 24,
                        bgcolor: 'primary.main',
                        borderRadius: 4,
                        mr: 1.5
                      }
                    }}
                  >
                    Basic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Invoice Number *"
                  name="invoiceNumber"
                  value={form.invoiceNumber}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.invoiceNumber}
                  helperText={errors.invoiceNumber}
                  disabled={isEdit}
                  size="medium"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 56
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vendor Name *"
                  name="vendorName"
                  value={form.vendorName}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.vendorName}
                  helperText={errors.vendorName}
                  size="medium"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 56
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Invoice Date *"
                    value={form.invoiceDate}
                    onChange={(date) => handleDateChange('invoiceDate', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.invoiceDate}
                        helperText={errors.invoiceDate}
                        size="medium"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            height: 56
                          } 
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={form.dueDate}
                    onChange={(date) => handleDateChange('dueDate', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.dueDate}
                        helperText={errors.dueDate}
                        size="medium"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            height: 56
                          } 
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount *"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  fullWidth
                  inputProps={{ min: 0, step: 0.01 }}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  size="medium"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 56
                    } 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 56
                    } 
                  }}
                >
                  <InputLabel id="currency-label">Currency</InputLabel>
                  <Select
                    labelId="currency-label"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    label="Currency"
                    size="medium"
                  >
                    {CURRENCIES.map(currency => (
                      <MenuItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    } 
                  }}
                />
              </Grid>
              
              {/* Custom Fields */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  mt: 2,
                  bgcolor: 'background.paper', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    color="primary" 
                    fontWeight="medium" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 4,
                        height: 24,
                        bgcolor: 'primary.main',
                        borderRadius: 4,
                        mr: 1.5
                      }
                    }}
                  >
                    Custom Fields
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  alignItems: { xs: 'stretch', sm: 'flex-start' }, 
                  mb: 2,
                  gap: 2
                }}>
                  <TextField
                    label="Field Name"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    error={!!errors.customFieldName}
                    helperText={errors.customFieldName}
                    size="medium"
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        height: 56
                      } 
                    }}
                  />
                  <TextField
                    label="Field Value"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    size="medium"
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        height: 56
                      } 
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddCustomField}
                    size="large"
                    sx={{ 
                      minWidth: { xs: '100%', sm: 150 },
                      height: 56,
                      borderRadius: 1.5
                    }}
                  >
                    Add Field
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Stack spacing={1}>
                  {form.customFields.map((field) => (
                    <Box
                      key={field.id || field.name}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: 'background.paper',
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: 'divider',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                          borderColor: 'primary.light'
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" component="span" fontWeight="bold">
                          {field.name}:
                        </Typography>
                        <Typography component="span" sx={{ ml: 1 }}>
                          {field.value}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveCustomField(field.id || field.name)}
                        sx={{
                          bgcolor: 'error.light',
                          color: 'error.contrastText',
                          '&:hover': {
                            bgcolor: 'error.main'
                          },
                          width: 34,
                          height: 34
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Grid>
              
              {/* Attachments */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  mt: 2,
                  bgcolor: 'background.paper', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    color="primary" 
                    fontWeight="medium" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 4,
                        height: 24,
                        bgcolor: 'primary.main',
                        borderRadius: 4,
                        mr: 1.5
                      }
                    }}
                  >
                    Attachments
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ p: 1 }}>
                  <FileUploader
                    files={form.attachments}
                    onChange={handleFileChange}
                    maxFiles={5}
                    maxSizeInMb={10}
                    acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/gif']}
                    error={!!errors.attachments}
                    helperText={errors.attachments}
                  />
                </Box>
              </Grid>
              
              {/* Notes */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1, 
                  mt: 2,
                  bgcolor: 'background.paper', 
                  py: 1, 
                  px: 2, 
                  borderRadius: 1.5,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <Typography 
                    variant="h6" 
                    color="primary" 
                    fontWeight="medium" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: 4,
                        height: 24,
                        bgcolor: 'primary.main',
                        borderRadius: 4,
                        mr: 1.5
                      }
                    }}
                  >
                    Notes
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.notes}
                  helperText={errors.notes ? errors.notes : `${form.notes.length}/1000 characters`}
                  inputProps={{ maxLength: 1000 }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    } 
                  }}
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mt: 3,
                  pt: 3,
                  borderTop: 1,
                  borderColor: 'divider',
                  gap: 2
                }}>
                  <Button
                    variant="outlined"
                    onClick={() => isEdit ? navigate(`/invoices/${id}`) : navigate('/invoices')}
                    size="large"
                    sx={{ 
                      borderRadius: 1.5,
                      height: 48,
                      px: 3
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <Save />}
                    size="large"
                    sx={{ 
                      borderRadius: 1.5,
                      height: 48,
                      px: 3,
                      boxShadow: 2
                    }}
                  >
                    {isSubmitting 
                      ? (isEdit ? 'Updating...' : 'Creating...') 
                      : (isEdit ? 'Update Invoice' : 'Create Invoice')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceForm; 