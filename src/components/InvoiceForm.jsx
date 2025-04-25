import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase/config';
import { uploadMultipleFiles, validateFile, MAX_ATTACHMENTS, ALLOWED_FILE_TYPES } from '../utils/fileUpload';
import { logActivity } from '../utils/activityLogger';
import { Button, TextField, Typography, Box, Paper, Grid, MenuItem, IconButton, 
         Chip, Divider, FormHelperText, CircularProgress, Select, FormControl, 
         InputLabel, OutlinedInput, Checkbox, ListItemText } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const InvoiceForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, userProfile } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  
  // Basic invoice fields
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    vendor: '',
    amount: '',
    currency: 'USD',
    status: 'draft',
    description: '',
    notes: '',
    paymentTerms: '',
    taxAmount: '',
  });
  
  // Custom fields
  const [customFields, setCustomFields] = useState([]);
  
  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  
  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Generate a unique invoice number prefixed by organization's initials
    if (userProfile?.organizationId) {
      const orgInitials = userProfile.organizationName
        ?.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase() || 'INV';
      
      const uniqueId = Math.floor(100000 + Math.random() * 900000);
      setInvoiceData(prev => ({
        ...prev,
        invoiceNumber: `${orgInitials}-${uniqueId}`
      }));
      
      // Fetch users from the same organization for reviewer selection
      fetchOrganizationUsers(userProfile.organizationId);
    }
  }, [userProfile]);

  // Fetch users from the same organization
  const fetchOrganizationUsers = async (orgId) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('organizationId', '==', orgId), orderBy('displayName'));
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Exclude current user from reviewer list
        if (userData.uid !== user.uid) {
          users.push({
            uid: userData.uid,
            displayName: userData.displayName,
            email: userData.email,
            role: userData.role
          });
        }
      });
      
      setOrganizationUsers(users);
    } catch (error) {
      console.error('Error fetching organization users:', error);
      toast.error('Failed to load reviewers list');
    }
  };

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle custom field changes
  const handleCustomFieldChange = (index, field, value) => {
    const updatedFields = [...customFields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setCustomFields(updatedFields);
  };

  // Add a new custom field
  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '' }]);
  };

  // Remove a custom field
  const removeCustomField = (index) => {
    const updatedFields = [...customFields];
    updatedFields.splice(index, 1);
    setCustomFields(updatedFields);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + attachments.length > MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }
    
    // Validate each file
    const newAttachments = [];
    const newPreviews = [];
    
    files.forEach(file => {
      const validation = validateFile(file);
      
      if (validation.valid) {
        newAttachments.push(file);
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push({
              name: file.name,
              url: e.target.result
            });
            setFilePreview([...filePreview, ...newPreviews]);
          };
          reader.readAsDataURL(file);
        } else {
          // For PDFs just store the name
          newPreviews.push({
            name: file.name,
            url: null
          });
          setFilePreview([...filePreview, ...newPreviews]);
        }
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });
    
    setAttachments([...attachments, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    const updatedAttachments = [...attachments];
    const updatedPreviews = [...filePreview];
    
    updatedAttachments.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    setAttachments(updatedAttachments);
    setFilePreview(updatedPreviews);
  };

  // Handle reviewer selection
  const handleReviewerChange = (event) => {
    const { value } = event.target;
    setSelectedReviewers(value);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!invoiceData.invoiceNumber) newErrors.invoiceNumber = 'Invoice number is required';
    if (!invoiceData.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!invoiceData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!invoiceData.vendor) newErrors.vendor = 'Vendor is required';
    if (!invoiceData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(invoiceData.amount) || parseFloat(invoiceData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    // Notes character limit
    if (invoiceData.notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }
    
    // Validate dates
    if (invoiceData.issueDate && invoiceData.dueDate) {
      const issueDate = new Date(invoiceData.issueDate);
      const dueDate = new Date(invoiceData.dueDate);
      
      if (dueDate < issueDate) {
        newErrors.dueDate = 'Due date cannot be before issue date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create invoice document first to get the ID
      const invoiceRef = collection(db, `organizations/${userProfile.organizationId}/invoices`);
      
      const invoiceData = {
        invoiceNumber: invoiceData.invoiceNumber,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        vendor: invoiceData.vendor,
        amount: parseFloat(invoiceData.amount),
        currency: invoiceData.currency,
        status: invoiceData.status,
        description: invoiceData.description,
        notes: invoiceData.notes,
        paymentTerms: invoiceData.paymentTerms,
        taxAmount: invoiceData.taxAmount ? parseFloat(invoiceData.taxAmount) : 0,
        customFields: customFields.filter(field => field.name && field.value),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        organizationId: userProfile.organizationId,
        reviewers: selectedReviewers,
        attachments: [] // Will be populated after file upload
      };
      
      const docRef = await addDoc(invoiceRef, invoiceData);
      const invoiceId = docRef.id;
      
      // Upload attachments if any
      if (attachments.length > 0) {
        setUploading(true);
        const uploadResult = await uploadMultipleFiles(
          attachments, 
          userProfile.organizationId, 
          invoiceId
        );
        
        if (uploadResult.success) {
          // Update invoice with attachment details
          await updateDoc(docRef, {
            attachments: uploadResult.results.map(result => ({
              fileName: result.fileName,
              fileSize: result.fileSize,
              fileType: result.fileType,
              downloadURL: result.downloadURL,
              uploadPath: result.uploadPath
            }))
          });
        } else {
          toast.warning('Some attachments failed to upload');
        }
        setUploading(false);
      }
      
      // Log activity
      await logActivity(
        'INVOICE_CREATED',
        user.uid,
        userProfile.organizationId,
        invoiceId,
        'invoice',
        { invoiceNumber: invoiceData.invoiceNumber }
      );
      
      toast.success('Invoice created successfully!');
      navigate('/invoices');
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  // Cancel form submission
  const handleCancel = () => {
    navigate('/invoices');
  };

  // If user or organization data is not loaded yet
  if (!user || !userProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Create New Invoice
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Basic Invoice Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              name="invoiceNumber"
              value={invoiceData.invoiceNumber}
              onChange={handleInputChange}
              error={!!errors.invoiceNumber}
              helperText={errors.invoiceNumber}
              disabled
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Vendor"
              name="vendor"
              value={invoiceData.vendor}
              onChange={handleInputChange}
              error={!!errors.vendor}
              helperText={errors.vendor}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Issue Date"
              name="issueDate"
              type="date"
              value={invoiceData.issueDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.issueDate}
              helperText={errors.issueDate}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Due Date"
              name="dueDate"
              type="date"
              value={invoiceData.dueDate}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.dueDate}
              helperText={errors.dueDate}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={invoiceData.amount}
              onChange={handleInputChange}
              error={!!errors.amount}
              helperText={errors.amount}
              margin="normal"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Currency"
              name="currency"
              select
              value={invoiceData.currency}
              onChange={handleInputChange}
              margin="normal"
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="JPY">JPY (¥)</MenuItem>
              <MenuItem value="CAD">CAD (C$)</MenuItem>
              <MenuItem value="AUD">AUD (A$)</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tax Amount"
              name="taxAmount"
              type="number"
              value={invoiceData.taxAmount}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={invoiceData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Terms"
              name="paymentTerms"
              value={invoiceData.paymentTerms}
              onChange={handleInputChange}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={invoiceData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={4}
              error={!!errors.notes}
              helperText={errors.notes || `${invoiceData.notes.length}/1000 characters`}
              inputProps={{ maxLength: 1000 }}
            />
          </Grid>
          
          {/* Status */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Status"
              name="status"
              select
              value={invoiceData.status}
              onChange={handleInputChange}
              margin="normal"
            >
              {INVOICE_STATUSES.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {/* Reviewer Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="reviewers-label">Assign Reviewers</InputLabel>
              <Select
                labelId="reviewers-label"
                id="reviewers"
                multiple
                value={selectedReviewers}
                onChange={handleReviewerChange}
                input={<OutlinedInput label="Assign Reviewers" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const reviewer = organizationUsers.find(user => user.uid === value);
                      return (
                        <Chip 
                          key={value} 
                          label={reviewer ? reviewer.displayName : value} 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {organizationUsers.map((user) => (
                  <MenuItem key={user.uid} value={user.uid}>
                    <Checkbox checked={selectedReviewers.indexOf(user.uid) > -1} />
                    <ListItemText 
                      primary={user.displayName} 
                      secondary={user.email} 
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Custom Fields */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Custom Fields
            </Typography>
            
            {customFields.map((field, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Field Name"
                    value={field.name}
                    onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Field Value"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton onClick={() => removeCustomField(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={addCustomField}
              variant="outlined"
              sx={{ mt: 1 }}
            >
              Add Custom Field
            </Button>
          </Grid>
          
          {/* File Attachments */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileSelect}
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
            </Button>
            
            <FormHelperText>
              Max {MAX_ATTACHMENTS} files, 10MB each (PDF, JPG, PNG)
            </FormHelperText>
            
            <Box sx={{ mt: 2 }}>
              {filePreview.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    mb: 1,
                    border: '1px solid #ddd',
                    borderRadius: 1
                  }}
                >
                  {file.url && file.url.startsWith('data:image') ? (
                    <Box
                      component="img"
                      src={file.url}
                      alt={file.name}
                      sx={{ width: 50, height: 50, objectFit: 'cover', mr: 2 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.200',
                        mr: 2
                      }}
                    >
                      PDF
                    </Box>
                  )}
                  <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                    {file.name}
                  </Typography>
                  <IconButton onClick={() => removeAttachment(index)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
          
          {/* Form Actions */}
          <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              sx={{ mr: 2 }}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || uploading}
              startIcon={loading || uploading ? <CircularProgress size={20} /> : null}
            >
              {loading || uploading ? 'Saving...' : 'Create Invoice'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default InvoiceForm; 