import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  IconButton,
  CircularProgress,
  InputAdornment,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ColorLens as ColorLensIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  Language as LanguageIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import * as yup from 'yup';
import { getSettings, updateSettings } from '../../redux/slices/settingsSlice';

// Email validation schema
const emailSchema = yup.string().email('Invalid email format').required('Email is required');

const SystemSettings = () => {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const { settings, isLoading, isSuccess, isError, message } = useSelector((state) => state.settings);
  
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [emailError, setEmailError] = useState('');
  
  // General settings with Indian defaults
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Acme Corporation',
    contactEmail: 'admin@example.com',
    defaultCurrency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });
  
  // Invoice settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    autoGenerateNumbers: true,
    numberPrefix: 'INV-',
    defaultDueDays: 30,
    requireNotesForRejection: true,
    allowEditsAfterApproval: true,
    notifyOnStatusChange: true,
  });

  // Load settings from the server when component mounts
  useEffect(() => {
    dispatch(getSettings());
  }, [dispatch]);

  // Load saved settings from Redux store when settings are fetched
  useEffect(() => {
    if (settings) {
      if (settings.general) {
        setGeneralSettings({
          ...generalSettings,
          ...settings.general,
          // Ensure Indian defaults are applied
          defaultCurrency: settings.general.defaultCurrency || 'INR',
          dateFormat: settings.general.dateFormat || 'DD/MM/YYYY',
          timezone: settings.general.timezone || 'Asia/Kolkata',
        });
      }
      if (settings.invoice) {
        setInvoiceSettings({
          ...invoiceSettings,
          ...settings.invoice,
          // Ensure allowEditsAfterApproval is enabled by default
          allowEditsAfterApproval: settings.invoice.allowEditsAfterApproval !== undefined 
            ? settings.invoice.allowEditsAfterApproval 
            : true,
        });
      }
    }
  }, [settings]);

  // Handle success and error states
  useEffect(() => {
    if (isSuccess && message) {
      setSnackbar({
        open: true,
        message: message,
        severity: 'success',
      });
      setSaving(false);
    }
    
    if (isError) {
      setSnackbar({
        open: true,
        message: message,
        severity: 'error',
      });
      setSaving(false);
    }
  }, [isSuccess, isError, message]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle general settings change
  const handleGeneralChange = (field, value) => {
    setGeneralSettings({
      ...generalSettings,
      [field]: value,
    });
    
    // Validate email when it changes
    if (field === 'contactEmail') {
      try {
        emailSchema.validateSync(value);
        setEmailError('');
      } catch (err) {
        setEmailError(err.message);
      }
    }
  };
  
  // Handle invoice settings change
  const handleInvoiceChange = (field, value) => {
    setInvoiceSettings({
      ...invoiceSettings,
      [field]: value,
    });
  };
  
  // Validate settings before saving
  const validateSettings = () => {
    try {
      emailSchema.validateSync(generalSettings.contactEmail);
      return true;
    } catch (err) {
      setEmailError(err.message);
      setTabValue(0); // Switch to general tab where the error is
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors before saving',
        severity: 'error',
      });
      return false;
    }
  };
  
  // Save all settings to the database
  const handleSaveSettings = async () => {
    // First validate settings
    if (!validateSettings()) {
      return;
    }
    
    setSaving(true);
    try {
      // Combine all settings
      const allSettings = {
        general: generalSettings,
        invoice: invoiceSettings,
      };
      
      // Dispatch to Redux and server
      dispatch(updateSettings(allSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
      setSaving(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Display loading state
  if (isLoading && !settings.general) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading System Settings...
        </Typography>
      </Box>
    );
  }

  // Display error state with retry option
  if (isError && !settings.general) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 500 }}>
          {message || 'Failed to load settings. Please try again.'}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => dispatch(getSettings())}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          System Settings
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving || isLoading}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="system settings tabs"
            variant="fullWidth"
          >
            <Tab icon={<SettingsIcon />} label="General" />
            <Tab icon={<CloudUploadIcon />} label="Invoice" />
          </Tabs>
        </Box>
        
        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            General Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="company-name"
                name="companyName"
                fullWidth
                label="Company Name"
                value={generalSettings.companyName}
                onChange={(e) => handleGeneralChange('companyName', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
                aria-required="true"
                autoComplete="organization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="contact-email"
                name="contactEmail"
                fullWidth
                label="Contact Email"
                value={generalSettings.contactEmail}
                onChange={(e) => handleGeneralChange('contactEmail', e.target.value)}
                variant="outlined"
                error={Boolean(emailError)}
                helperText={emailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
                aria-required="true"
                aria-invalid={Boolean(emailError)}
                autoComplete="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="currency-select-label">Default Currency</InputLabel>
                <Select
                  labelId="currency-select-label"
                  id="default-currency"
                  name="defaultCurrency"
                  value={generalSettings.defaultCurrency}
                  onChange={(e) => handleGeneralChange('defaultCurrency', e.target.value)}
                  label="Default Currency"
                  startAdornment={
                    <InputAdornment position="start">
                      <CurrencyExchangeIcon />
                    </InputAdornment>
                  }
                  aria-label="Select default currency"
                >
                  <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                  <MenuItem value="USD">US Dollar ($)</MenuItem>
                  <MenuItem value="EUR">Euro (€)</MenuItem>
                  <MenuItem value="GBP">British Pound (£)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="date-format-select-label">Date Format</InputLabel>
                <Select
                  labelId="date-format-select-label"
                  value={generalSettings.dateFormat}
                  onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                  label="Date Format"
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="language-select-label">Language</InputLabel>
                <Select
                  labelId="language-select-label"
                  value={generalSettings.language}
                  onChange={(e) => handleGeneralChange('language', e.target.value)}
                  label="Language"
                  startAdornment={
                    <InputAdornment position="start">
                      <LanguageIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">Hindi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="timezone-select-label">Timezone</InputLabel>
                <Select
                  labelId="timezone-select-label"
                  value={generalSettings.timezone}
                  onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                  label="Timezone"
                  startAdornment={
                    <InputAdornment position="start">
                      <PublicIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="Asia/Kolkata">Indian Standard Time (IST)</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="Europe/London">Greenwich Mean Time (GMT)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Japan Standard Time (JST)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Invoice Settings */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Invoice Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    id="auto-generate-numbers"
                    name="autoGenerateNumbers"
                    checked={invoiceSettings.autoGenerateNumbers}
                    onChange={(e) => handleInvoiceChange('autoGenerateNumbers', e.target.checked)}
                    color="primary"
                    inputProps={{
                      'aria-label': 'Auto-generate invoice numbers'
                    }}
                  />
                }
                label="Auto-generate Invoice Numbers"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="invoice-number-prefix"
                name="numberPrefix"
                fullWidth
                label="Invoice Number Prefix"
                value={invoiceSettings.numberPrefix}
                onChange={(e) => handleInvoiceChange('numberPrefix', e.target.value)}
                disabled={!invoiceSettings.autoGenerateNumbers}
                variant="outlined"
                helperText={invoiceSettings.autoGenerateNumbers ? 
                  "Prefix used for automatically generated invoice numbers" : 
                  "Enable auto-generate invoice numbers to edit prefix"}
                aria-disabled={!invoiceSettings.autoGenerateNumbers}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="default-due-days"
                name="defaultDueDays"
                fullWidth
                label="Default Due Days"
                type="number"
                value={invoiceSettings.defaultDueDays}
                onChange={(e) => handleInvoiceChange('defaultDueDays', parseInt(e.target.value))}
                variant="outlined"
                InputProps={{
                  inputProps: { min: 0, max: 180 }
                }}
                helperText="Default number of days until invoice payment is due"
                aria-label="Default number of days until invoice is due"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={invoiceSettings.requireNotesForRejection}
                    onChange={(e) => handleInvoiceChange('requireNotesForRejection', e.target.checked)}
                    color="primary"
                  />
                }
                label="Require Notes for Rejection"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={invoiceSettings.allowEditsAfterApproval}
                    onChange={(e) => handleInvoiceChange('allowEditsAfterApproval', e.target.checked)}
                    color="primary"
                  />
                }
                label="Allow Edits After Approval"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={invoiceSettings.notifyOnStatusChange}
                    onChange={(e) => handleInvoiceChange('notifyOnStatusChange', e.target.checked)}
                    color="primary"
                  />
                }
                label="Notify on Status Change"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default SystemSettings; 