import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack,
  AttachFile as AttachFileIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  PictureAsPdf as PdfIcon,
  PlaylistAdd as CustomFieldIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  PersonAdd as AssignIcon,
  Image as ImageIcon,
  Note as NoteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  createInvoice,
  getInvoiceById,
  updateInvoice,
  getOrganizationUsers,
  assignInvoiceReviewers,
} from '../redux/slices/invoiceSlice';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { rtdb, storage, auth } from '../firebase';
import { logActivity } from '../utils/activityLogger';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_NOTE_LENGTH = 1000;
const MAX_ATTACHMENTS = 5;

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef(null);

  const { currentInvoice, organizationUsers, loading, error } = useSelector((state) => state.invoices);
  const { user, organizationId } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorName: '',
    vendorAddress: '',
    amount: '',
    description: '',
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days from now
    items: [],
    customFields: [],
    note: '',
    status: 'pending'
  });

  const [attachments, setAttachments] = useState([]);
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

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

  const [customFieldForm, setCustomFieldForm] = useState({
    name: '',
    value: '',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [filteredReviewers, setFilteredReviewers] = useState([]);
  
  // Filtered reviewers based on search
  const filteredReviewers = reviewerSearch 
    ? organizationUsers.filter(user => 
        user.displayName?.toLowerCase().includes(reviewerSearch.toLowerCase()) || 
        user.email?.toLowerCase().includes(reviewerSearch.toLowerCase()))
    : organizationUsers;

  useEffect(() => {
    // Fetch organization users for reviewer assignment
    dispatch(getOrganizationUsers());
    
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
        dueDate: currentInvoice.dueDate 
          ? format(new Date(currentInvoice.dueDate), 'yyyy-MM-dd') 
          : format(new Date(), 'yyyy-MM-dd'),
        items: currentInvoice.items || [],
        customFields: currentInvoice.customFields || [],
        note: currentInvoice.note || '',
        status: currentInvoice.status || 'pending'
      });
      
      // Set existing attachments if any
      if (currentInvoice.attachments) {
        setAttachments(currentInvoice.attachments);
      }
      
      // Set assigned reviewers if any
      if (currentInvoice.reviewerIds) {
        setSelectedReviewers(currentInvoice.reviewerIds);
      }
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

  const handleCustomFieldChange = (e) => {
    const { name, value } = e.target;
    setCustomFieldForm({
      ...customFieldForm,
      [name]: value,
    });
  };

  const addCustomField = () => {
    // Validate custom field form
    const errors = {};
    if (!customFieldForm.name.trim()) errors.customFieldName = 'Field name is required';
    if (!customFieldForm.value.trim()) errors.customFieldValue = 'Field value is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors({ ...validationErrors, ...errors });
      return;
    }

    const newCustomField = {
      name: customFieldForm.name.trim(),
      value: customFieldForm.value.trim(),
    };

    setFormData({
      ...formData,
      customFields: [...formData.customFields, newCustomField],
    });

    // Reset custom field form
    setCustomFieldForm({
      name: '',
      value: '',
    });
  };

  const removeCustomField = (index) => {
    const updatedCustomFields = formData.customFields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      customFields: updatedCustomFields,
    });
  };

  const handleNoteChange = (e) => {
    const note = e.target.value;
    // Ensure note doesn't exceed max length
    if (note.length <= MAX_NOTE_LENGTH) {
      setFormData({
        ...formData,
        note,
      });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      setSnackbar({
        open: true,
        message: `You can only upload up to ${MAX_ATTACHMENTS} files`,
        severity: 'error'
      });
      return;
    }
    
    const newAttachments = files.map(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setSnackbar({
          open: true,
          message: `File "${file.name}" exceeds the maximum size of ${formatFileSize(MAX_FILE_SIZE)}`,
          severity: 'error'
        });
        return null;
      }
      
      // Validate file type
      if (!(file.type.includes('image/') || file.type === 'application/pdf')) {
        setSnackbar({
          open: true,
          message: `File "${file.name}" is not a supported format (PDF or image)`,
          severity: 'error'
        });
        return null;
      }
      
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file, // Store actual file for upload
      };
    }).filter(Boolean); // Remove null entries
    
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = null; // Reset input
  };

  const removeAttachment = async (index) => {
    const attachment = attachments[index];
    
    // If this is an already uploaded file with a URL, delete it from storage
    if (attachment.url && !attachment.file) {
      try {
        const storageRef = ref(storage, attachment.path);
        await deleteObject(storageRef);
      } catch (error) {
        console.error("Error removing file from storage:", error);
        setSnackbar({
          open: true,
          message: `Error removing file: ${error.message}`,
          severity: 'error'
        });
        return;
      }
    }
    
    // Remove from state
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle reviewer selection
  const toggleReviewerSelection = (reviewerId) => {
    setSelectedReviewers(prevSelected => {
      if (prevSelected.includes(reviewerId)) {
        return prevSelected.filter(id => id !== reviewerId);
      } else {
        return [...prevSelected, reviewerId];
      }
    });
  };

  const handleReviewerSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setReviewerSearch(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredReviewers(organizationUsers.filter(user => user.id !== user.uid));
    } else {
      setFilteredReviewers(
        organizationUsers.filter(user => 
          (user.displayName?.toLowerCase().includes(searchTerm) || 
          user.email?.toLowerCase().includes(searchTerm)) &&
          user.id !== auth.currentUser.uid
        )
      );
    }
  };

  const handleAssignReviewers = () => {
    if (selectedReviewers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one reviewer',
        severity: 'warning',
      });
      return;
    }

    if (isEditMode) {
      dispatch(assignInvoiceReviewers({ id, reviewerIds: selectedReviewers }))
        .unwrap()
        .then(() => {
          setSnackbar({
            open: true,
            message: 'Reviewers assigned successfully',
            severity: 'success',
          });
          setAssignDialogOpen(false);
        })
        .catch((err) => {
          setSnackbar({
            open: true,
            message: err || 'Failed to assign reviewers',
            severity: 'error',
          });
        });
    } else {
      // For new invoices, just close the dialog and save reviewer IDs with the invoice later
      setAssignDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Reviewers will be assigned when the invoice is created',
        severity: 'info',
      });
    }
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
      amount: newAmount.toFixed(2),
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
      amount: newAmount.toFixed(2),
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
    
    // Validate note length
    if (formData.note && formData.note.length > MAX_NOTE_LENGTH) {
      errors.note = `Note cannot exceed ${MAX_NOTE_LENGTH} characters`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.invoiceNumber || !formData.vendorName || !formData.dueDate || !formData.amount) {
        setSnackbar({
          open: true,
          message: 'Please fill all required fields',
          severity: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      // Create a new invoice object
      const timestamp = new Date().toISOString();
      let invoiceId = id || uuidv4();

      const invoiceData = {
        ...formData,
        id: invoiceId,
        status: 'pending',
        createdBy: auth.currentUser.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        organizationId: organizationId,
        customFields: formData.customFields,
        notes: formData.note,
        reviewers: selectedReviewers,
        attachments: [], // Will be populated after file uploads
      };

      // Upload attachments if any
      const uploadPromises = [];
      const uploadedAttachments = [];

      for (const attachment of attachments) {
        if (attachment.file) {
          // This is a new file that needs to be uploaded
          const fileName = `${Date.now()}_${attachment.name}`;
          const filePath = `organizations/${organizationId}/invoices/${invoiceId}/attachments/${fileName}`;
          const storageRef = ref(storage, filePath);
          
          const uploadTask = uploadBytesResumable(storageRef, attachment.file);
          
          const uploadPromise = new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                // Calculate progress percentage
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                
                // Update progress in attachment object
                setAttachments(prev => 
                  prev.map(item => 
                    item === attachment ? { ...item, progress } : item
                  )
                );
              },
              (error) => {
                console.error('Upload error:', error);
                reject(error);
              },
              async () => {
                // Upload completed, get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                uploadedAttachments.push({
                  name: attachment.name,
                  type: attachment.type,
                  size: attachment.size,
                  url: downloadURL,
                  path: filePath,
                  uploadedAt: new Date().toISOString()
                });
                
                resolve();
              }
            );
          });
          
          uploadPromises.push(uploadPromise);
        } else if (attachment.url) {
          // This is an existing file, just add it to the list
          uploadedAttachments.push(attachment);
        }
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Add attachments to invoice data
      invoiceData.attachments = uploadedAttachments;
      
      // Save to Realtime Database
      if (isEditMode) {
        // Update existing invoice
        await rtdb.updateData(`organizations/${organizationId}/invoices/${invoiceId}`, invoiceData);
      } else {
        // Create new invoice
        await rtdb.setData(`organizations/${organizationId}/invoices/${invoiceId}`, invoiceData);
      }

      // Log the activity
      await logActivity({
        action: isEditMode ? 'update_invoice' : 'create_invoice',
        userId: auth.currentUser.uid,
        organizationId: organizationId,
        targetId: invoiceId,
        targetType: 'invoice',
        details: {
          invoiceNumber: formData.invoiceNumber,
          vendorName: formData.vendorName,
          totalAmount: formData.amount
        }
      });

      // Success notification
      setSnackbar({
        open: true,
        message: isEditMode ? 'Invoice updated successfully' : 'Invoice created successfully',
        severity: 'success'
      });

      // Navigate back to invoices list
      setTimeout(() => {
        navigate('/invoices');
      }, 1500);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
      setIsSubmitting(false);
    }
  };

  if (isEditMode && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading invoice details...</Typography>
      </Box>
    );
  }

  return (
    <div className="invoice-form-container" style={{ padding: '24px' }}>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Paper elevation={3} style={{ padding: '24px', marginBottom: '24px' }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
        </Typography>
        
        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '16px' }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Invoice Number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                error={!!validationErrors.invoiceNumber}
                helperText={validationErrors.invoiceNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Vendor Name"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                error={!!validationErrors.vendorName}
                helperText={validationErrors.vendorName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="Due Date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={!!validationErrors.dueDate}
                helperText={validationErrors.dueDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Amount"
                value={formData.amount}
                InputProps={{
                  readOnly: formData.items.length > 0,
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </Grid>
          </Grid>

          {/* Invoice Items Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '32px' }}>
            Invoice Items
          </Typography>
          <Grid container spacing={3} style={{ marginBottom: '16px' }}>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Item Description"
                value={itemForm.description}
                onChange={(e) => handleItemChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={itemForm.quantity}
                onChange={(e) => handleItemChange('quantity', e.target.value)}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Unit Price"
                value={itemForm.unitPrice}
                onChange={(e) => handleItemChange('unitPrice', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddIcon />}
                onClick={addItem}
                style={{ height: '100%' }}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          {formData.items.length > 0 && (
            <TableContainer component={Paper} style={{ marginBottom: '24px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
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
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right">
                      <strong>${parseFloat(formData.amount).toFixed(2)}</strong>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Custom Fields Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '32px' }}>
            Custom Fields
          </Typography>
          <Grid container spacing={3} style={{ marginBottom: '16px' }}>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Field Name"
                value={customFieldForm.name}
                onChange={(e) => handleCustomFieldChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Field Value"
                value={customFieldForm.value}
                onChange={(e) => handleCustomFieldChange('value', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddIcon />}
                onClick={addCustomField}
                style={{ height: '100%' }}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          {formData.customFields.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              {formData.customFields.map((field, index) => (
                <Chip
                  key={index}
                  label={`${field.name}: ${field.value}`}
                  onDelete={() => removeCustomField(index)}
                  style={{ margin: '4px' }}
                />
              ))}
            </div>
          )}

          {/* Notes Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '32px' }}>
            Notes
          </Typography>
          <Grid container spacing={3} style={{ marginBottom: '16px' }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                value={formData.note}
                onChange={handleNoteChange}
                error={!!validationErrors.note}
                helperText={
                  validationErrors.note || 
                  `${formData.note.length}/${MAX_NOTE_LENGTH} characters`
                }
              />
            </Grid>
          </Grid>

          {/* Attachments Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '32px' }}>
            Attachments ({attachments.length}/{MAX_ATTACHMENTS})
          </Typography>
          <Grid container spacing={3} style={{ marginBottom: '16px' }}>
            <Grid item xs={12}>
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFileIcon />}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                >
                  Add Files (Max {formatFileSize(MAX_FILE_SIZE)} each)
                </Button>
              </label>
              <Typography variant="caption" display="block" style={{ marginTop: '8px' }}>
                Supported formats: PDF, JPG, PNG, GIF
              </Typography>
            </Grid>
          </Grid>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginBottom: '16px' }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="caption">
                Uploading: {uploadProgress.toFixed(0)}%
              </Typography>
            </div>
          )}

          {attachments.length > 0 && (
            <List style={{ marginBottom: '24px' }}>
              {attachments.map((attachment, index) => (
                <ListItem key={index}>
                  <ListItemAvatar>
                    <Avatar>
                      {attachment.type?.includes('image') ? (
                        <ImageIcon />
                      ) : (
                        <PictureAsPdfIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={attachment.name}
                    secondary={`${formatFileSize(attachment.size)} - ${
                      attachment.file ? 'Pending upload' : 'Already uploaded'
                    }`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => removeAttachment(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Reviewer Assignment Section */}
          <Typography variant="h6" gutterBottom style={{ marginTop: '32px' }}>
            Assign Reviewers
          </Typography>
          <Grid container spacing={3} style={{ marginBottom: '16px' }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search for reviewers"
                value={reviewerSearch}
                onChange={handleReviewerSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>

          {organizationUsers.length > 0 ? (
            <Paper variant="outlined" style={{ maxHeight: '300px', overflow: 'auto', marginBottom: '24px' }}>
              <List>
                {filteredReviewers.map((user) => (
                  <React.Fragment key={user.id}>
                    <ListItem dense button onClick={() => toggleReviewerSelection(user.id)}>
                      <ListItemAvatar>
                        <Avatar src={user.photoURL || undefined}>
                          {!user.photoURL && (user.displayName?.[0] || user.email?.[0])}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.displayName || 'Unnamed User'}
                        secondary={user.email}
                      />
                      <Checkbox
                        edge="end"
                        checked={selectedReviewers.includes(user.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: '24px' }}>
              No other users found in your organization
            </Typography>
          )}

          {selectedReviewers.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Reviewers:
              </Typography>
              <div>
                {selectedReviewers.map((reviewerId) => {
                  const reviewer = organizationUsers.find((u) => u.id === reviewerId);
                  return (
                    <Chip
                      key={reviewerId}
                      avatar={
                        <Avatar src={reviewer?.photoURL || undefined}>
                          {!reviewer?.photoURL && (reviewer?.displayName?.[0] || reviewer?.email?.[0])}
                        </Avatar>
                      }
                      label={reviewer?.displayName || reviewer?.email || 'Unknown User'}
                      onDelete={() => toggleReviewerSelection(reviewerId)}
                      style={{ margin: '4px' }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CloseIcon />}
              onClick={() => navigate('/invoices')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {isEditMode ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};

export default InvoiceForm; 