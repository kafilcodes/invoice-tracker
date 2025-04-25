import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Box, 
  Button, 
  TextField, 
  Grid, 
  Typography, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Paper, 
  CircularProgress,
  Divider,
  FormHelperText,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  LinearProgress,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Autocomplete,
  Fade,
  Grow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CustomDateFnsAdapter from '../CustomDateFnsAdapter';
import SaveIcon from '@mui/icons-material/Save';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUpload from '../FileUpload';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';

// Predefined categories with more options
const categories = [
  'Digital Services',
  'Web Development',
  'Mobile App Development',
  'Design Services',
  'Consulting',
  'Content Creation',
  'Marketing',
  'Software/SaaS',
  'Hardware/Equipment',
  'Maintenance',
  'Office Supplies',
  'Utilities',
  'Travel',
  'Rent',
  'Other'
];

// Currency options expanded
const currencies = [
  { value: 'USD', label: '$ (USD)' },
  { value: 'EUR', label: '€ (EUR)' },
  { value: 'GBP', label: '£ (GBP)' },
  { value: 'INR', label: '₹ (INR)' },
  { value: 'JPY', label: '¥ (JPY)' },
  { value: 'CAD', label: 'C$ (CAD)' },
  { value: 'AUD', label: 'A$ (AUD)' },
  { value: 'CNY', label: '¥ (CNY)' }
];

// Payment terms options
const paymentTerms = [
  { value: 'immediate', label: 'Due on Receipt' },
  { value: 'net7', label: 'Net 7 Days' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'custom', label: 'Custom Term' }
];

// File upload config
const fileConfig = {
  maxFiles: 5,
  maxSize: 20 * 1024 * 1024, // 20MB
  acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx']
};

// Validation schema enhanced with more fields
const validationSchema = Yup.object({
  vendorName: Yup.string()
    .required('Vendor name is required')
    .max(100, 'Vendor name cannot exceed 100 characters'),
  invoiceNumber: Yup.string()
    .required('Invoice number is required'),
  amount: Yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .typeError('Amount must be a number'),
  currency: Yup.string()
    .required('Currency is required'),
  issueDate: Yup.date()
    .required('Issue date is required')
    .typeError('Invalid date format'),
  dueDate: Yup.date()
    .required('Due date is required')
    .min(Yup.ref('issueDate'), 'Due date cannot be before issue date')
    .typeError('Invalid date format'),
  category: Yup.string()
    .required('Category is required'),
  paymentTerm: Yup.string()
    .required('Payment term is required'),
  notes: Yup.string()
    .max(500, 'Notes cannot exceed 500 characters'),
  organizationRemark: Yup.string()
    .max(200, 'Organization remark cannot exceed 200 characters'),
  customFields: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().required('Field name is required'),
        value: Yup.string().required('Field value is required')
      })
    )
});

const InvoiceForm = ({ 
  invoice = null, 
  onSubmit, 
  isLoading = false, 
  title = 'New Invoice'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  
  const dispatch = useDispatch();
  const { user, organization } = useSelector(state => state.auth || {});
  
  // Initialize with any existing invoice data or defaults
  const formik = useFormik({
    initialValues: {
      vendorName: invoice?.vendorName || '',
      invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
      amount: invoice?.amount || '',
      currency: invoice?.currency || 'USD',
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : addDays(new Date(), 30),
      category: invoice?.category || '',
      paymentTerm: invoice?.paymentTerm || 'net30',
      notes: invoice?.notes || '',
      organizationRemark: invoice?.organizationRemark || '',
      organizationYear: invoice?.organizationYear || new Date().getFullYear().toString(),
      customFields: invoice?.customFields || []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsUploading(true);
        
        // Simulate file upload progress
        const uploadInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(uploadInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 300);
        
        // Create form data for submission
        const formData = {
          ...values,
          files: files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type
          })),
          createdBy: user?.uid,
          createdAt: new Date().toISOString(),
          status: 'pending',
          organizationId: organization?.id
        };
        
        // Add a small delay to show upload progress
        setTimeout(() => {
          clearInterval(uploadInterval);
          setUploadProgress(100);
          
          // Submit the form
          onSubmit(formData, invoice?._id);
          setIsUploading(false);
        }, 1500);
      } catch (error) {
        console.error('Error submitting form:', error);
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  });
  
  // Handle file change
  const handleFileChange = (newFiles) => {
    setFiles(newFiles);
  };
  
  // Handle adding a custom field
  const handleAddCustomField = () => {
    if (!customFieldName.trim()) return;
    
    const newCustomFields = [
      ...formik.values.customFields,
      { name: customFieldName.trim(), value: customFieldValue.trim() }
    ];
    
    formik.setFieldValue('customFields', newCustomFields);
    setCustomFieldName('');
    setCustomFieldValue('');
  };
  
  // Handle removing a custom field
  const handleRemoveCustomField = (index) => {
    const newCustomFields = [...formik.values.customFields];
    newCustomFields.splice(index, 1);
    formik.setFieldValue('customFields', newCustomFields);
  };
  
  // Generate a random invoice number
  function generateInvoiceNumber() {
    const orgPrefix = organization?.name?.substring(0, 3).toUpperCase() || 'INV';
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${orgPrefix}-${year}-${random}`;
  }
  
  // Add days to a date
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  return (
    <Grow in={true} timeout={500}>
    <Paper 
      elevation={3} 
      sx={{ 
          p: { xs: 2, sm: 4 }, 
        borderRadius: 2,
          backgroundColor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        {isUploading && (
          <LinearProgress 
            value={uploadProgress} 
            variant="determinate" 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 6,
              borderTopRightRadius: 8,
              borderTopLeftRadius: 8,
            }} 
          />
        )}
        
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
      <Typography 
              variant="h4" 
              component="h1"
        sx={{ 
          fontWeight: 600,
                color: 'primary.main',
                fontSize: { xs: '1.75rem', md: '2.25rem' }
        }}
      >
        {title}
      </Typography>
      
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => window.history.back()}
                size="large"
              >
                Cancel
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={formik.handleSubmit}
                disabled={isLoading || isUploading}
                startIcon={isLoading || isUploading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                size="large"
              >
                {isLoading || isUploading ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
      
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={4}>
              {/* Organization & Invoice Info */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ mb: 4, bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                      Organization & Invoice Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          id="organizationRemark"
                          name="organizationRemark"
                          label="Organization Remark"
                          value={formik.values.organizationRemark}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.organizationRemark && Boolean(formik.errors.organizationRemark)}
                          helperText={formik.touched.organizationRemark && formik.errors.organizationRemark}
                          disabled={isLoading}
                          placeholder="Enter organization remark or purpose for this invoice"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          id="organizationYear"
                          name="organizationYear"
                          label="Fiscal Year"
                          value={formik.values.organizationYear}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.organizationYear && Boolean(formik.errors.organizationYear)}
                          helperText={formik.touched.organizationYear && formik.errors.organizationYear}
                          disabled={isLoading}
                          placeholder="YYYY"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          id="invoiceNumber"
                          name="invoiceNumber"
                          label="Invoice Number"
                          value={formik.values.invoiceNumber}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.invoiceNumber && Boolean(formik.errors.invoiceNumber)}
                          helperText={formik.touched.invoiceNumber && formik.errors.invoiceNumber}
                          disabled={isLoading}
                          required
                          InputProps={{
                            endAdornment: (
                              <Tooltip title="Regenerate Invoice Number">
                                <IconButton 
                                  edge="end" 
                                  onClick={() => formik.setFieldValue('invoiceNumber', generateInvoiceNumber())}
                                  disabled={isLoading}
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Vendor Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                      Vendor Information
                    </Typography>
                    
        <Grid container spacing={3}>
                      <Grid item xs={12}>
            <TextField
              fullWidth
              id="vendorName"
              name="vendorName"
              label="Vendor Name"
              value={formik.values.vendorName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.vendorName && Boolean(formik.errors.vendorName)}
              helperText={formik.touched.vendorName && formik.errors.vendorName}
              disabled={isLoading}
              required
                          placeholder="Enter vendor or company name"
            />
          </Grid>
          
                      <Grid item xs={12}>
                        <FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
                          <InputLabel id="category-label" required>Category</InputLabel>
                          <Select
                            labelId="category-label"
                            id="category"
                            name="category"
                            value={formik.values.category}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label="Category"
                            disabled={isLoading}
                          >
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                          {formik.touched.category && formik.errors.category && (
                            <FormHelperText error>{formik.errors.category}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Payment Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                      Payment Information
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="amount"
              name="amount"
                          label="Amount"
              type="number"
              value={formik.values.amount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.amount && Boolean(formik.errors.amount)}
              helperText={formik.touched.amount && formik.errors.amount}
              disabled={isLoading}
              required
              InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {formik.values.currency === 'INR' ? <CurrencyRupeeIcon fontSize="small" /> : 
                                formik.values.currency === 'USD' ? <AttachMoneyIcon fontSize="small" /> :
                                formik.values.currency === 'EUR' ? "€" :
                                formik.values.currency === 'GBP' ? "£" : 
                                "$"}
                              </InputAdornment>
                            ),
              }}
              inputProps={{ step: "0.01", min: "0" }}
            />
          </Grid>
          
                      <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="currency-label">Currency</InputLabel>
              <Select
                labelId="currency-label"
                id="currency"
                name="currency"
                value={formik.values.currency}
                onChange={formik.handleChange}
                label="Currency"
                disabled={isLoading}
              >
                {currencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={CustomDateFnsAdapter}>
                          <DatePicker
                            label="Issue Date"
                            value={formik.values.issueDate}
                            onChange={(date) => formik.setFieldValue('issueDate', date)}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: formik.touched.issueDate && Boolean(formik.errors.issueDate),
                                helperText: formik.touched.issueDate && formik.errors.issueDate,
                                required: true
                              }
                            }}
                            disabled={isLoading}
                            format="dd/MM/yyyy"
                          />
                        </LocalizationProvider>
                      </Grid>
                      
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={CustomDateFnsAdapter}>
              <DatePicker
                label="Due Date"
                value={formik.values.dueDate}
                onChange={(date) => formik.setFieldValue('dueDate', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: formik.touched.dueDate && Boolean(formik.errors.dueDate),
                    helperText: formik.touched.dueDate && formik.errors.dueDate,
                    required: true
                  }
                }}
                disabled={isLoading}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel id="payment-term-label">Payment Terms</InputLabel>
              <Select
                            labelId="payment-term-label"
                            id="paymentTerm"
                            name="paymentTerm"
                            value={formik.values.paymentTerm}
                            onChange={(e) => {
                              formik.handleChange(e);
                              
                              // Update due date based on payment term
                              const term = e.target.value;
                              const issueDate = new Date(formik.values.issueDate);
                              
                              if (term === 'immediate') {
                                formik.setFieldValue('dueDate', issueDate);
                              } else if (term === 'net7') {
                                formik.setFieldValue('dueDate', addDays(issueDate, 7));
                              } else if (term === 'net15') {
                                formik.setFieldValue('dueDate', addDays(issueDate, 15));
                              } else if (term === 'net30') {
                                formik.setFieldValue('dueDate', addDays(issueDate, 30));
                              } else if (term === 'net60') {
                                formik.setFieldValue('dueDate', addDays(issueDate, 60));
                              }
                            }}
                            label="Payment Terms"
                  disabled={isLoading}
                >
                            {paymentTerms.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Custom Fields */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'medium' }}>
                        Custom Fields
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={showCustomFields}
                            onChange={() => setShowCustomFields(!showCustomFields)}
                            disabled={isLoading}
                          />
                        }
                        label="Add Custom Fields"
                      />
                    </Box>
                    
                    {showCustomFields && (
                      <Fade in={showCustomFields}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                            <TextField
                              label="Field Name"
                              value={customFieldName}
                              onChange={(e) => setCustomFieldName(e.target.value)}
                              disabled={isLoading}
                              sx={{ flex: 1, minWidth: { xs: '100%', md: '40%' } }}
                            />
                            <TextField
                              label="Field Value"
                              value={customFieldValue}
                              onChange={(e) => setCustomFieldValue(e.target.value)}
                              disabled={isLoading}
                              sx={{ flex: 1, minWidth: { xs: '100%', md: '40%' } }}
                            />
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={handleAddCustomField}
                              disabled={isLoading || !customFieldName}
                              sx={{ mt: { xs: 1, md: 0 }, minWidth: { xs: '100%', md: 'auto' } }}
                            >
                              Add Field
                            </Button>
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Add up to 10 custom fields (Currently: {formik.values.customFields.length}/10)
                          </Typography>
                          
                          <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                            {formik.values.customFields.length > 0 ? (
                              <Stack spacing={1}>
                                {formik.values.customFields.map((field, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      p: 2,
                                      bgcolor: 'background.paper',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="subtitle2" component="span">
                                        {field.name}:
                                      </Typography>
                                      <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                                        {field.value}
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveCustomField(index)}
                                      disabled={isLoading}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No custom fields added yet.
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Fade>
                    )}
                  </CardContent>
                </Card>
              </Grid>
          
          {/* Notes */}
          <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                      Notes
                    </Typography>
                    
            <TextField
              fullWidth
              id="notes"
              name="notes"
                      label="Invoice Notes"
              multiline
                      rows={6}
              value={formik.values.notes}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
                      helperText={
                        (formik.touched.notes && formik.errors.notes) ||
                        `${formik.values.notes.length}/500 characters`
                      }
              disabled={isLoading}
                      placeholder="Enter any additional information or notes about this invoice"
                      sx={{ mb: 2 }}
            />
                  </CardContent>
                </Card>
          </Grid>
          
          {/* File Upload */}
          <Grid item xs={12}>
                <Card variant="outlined" sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 3, fontWeight: 'medium' }}>
                      Attachments
            </Typography>
                    
            <FileUpload 
              onFileChange={handleFileChange} 
              disabled={isLoading}
              maxFiles={fileConfig.maxFiles}
              maxSize={fileConfig.maxSize}
              acceptedTypes={fileConfig.acceptedTypes}
            />
                    
            <FormHelperText>
                      Accepted file types: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 5 files, 20MB each)
            </FormHelperText>
                  </CardContent>
                </Card>
              </Grid>
          </Grid>
          </form>
        </Box>
    </Paper>
    </Grow>
  );
};

export default InvoiceForm; 