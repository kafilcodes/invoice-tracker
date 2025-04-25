import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  FormHelperText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { getCompanyInfo, updateCompanyInfo, uploadCompanyLogo } from '../redux/slices/companySlice';
import { uploadFileWithAPI } from '../utils/crudOperations';

// Indian States list
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const OrganizationSettings = () => {
  const dispatch = useDispatch();
  const { companyData, isLoading, isSuccess, isError, message } = useSelector((state) => state.company);
  const { user } = useSelector((state) => state.auth);
  
  // Company data state
  const [company, setCompany] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
    contactInfo: {
      email: '',
      phone: '',
      website: '',
    },
    gstNumber: '',
    panNumber: '',
    establishedYear: '',
    industry: '',
  });
  
  // Logo upload state
  const [logo, setLogo] = useState(null);
  const [logoURL, setLogoURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Load company data when component mounts
  useEffect(() => {
    dispatch(getCompanyInfo());
  }, [dispatch]);
  
  // Update form state when company data is fetched
  useEffect(() => {
    if (companyData) {
      setCompany({
        name: companyData.name || '',
        description: companyData.description || '',
        address: {
          street: companyData.address?.street || '',
          city: companyData.address?.city || '',
          state: companyData.address?.state || '',
          zipCode: companyData.address?.zipCode || '',
          country: companyData.address?.country || 'India',
        },
        contactInfo: {
          email: companyData.contactInfo?.email || '',
          phone: companyData.contactInfo?.phone || '',
          website: companyData.contactInfo?.website || '',
        },
        gstNumber: companyData.gstNumber || '',
        panNumber: companyData.panNumber || '',
        establishedYear: companyData.establishedYear || '',
        industry: companyData.industry || '',
      });
      
      if (companyData.logo) {
        setLogoURL(companyData.logo);
      }
    }
  }, [companyData]);
  
  // Handle success and error states
  useEffect(() => {
    if (isSuccess && message) {
      setSnackbar({
        open: true,
        message,
        severity: 'success',
      });
    }
    
    if (isError) {
      setSnackbar({
        open: true,
        message,
        severity: 'error',
      });
    }
  }, [isSuccess, isError, message]);
  
  // Handle basic info change
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCompany({ ...company, [name]: value });
  };
  
  // Handle address change
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setCompany({
      ...company,
      address: {
        ...company.address,
        [name]: value,
      },
    });
  };
  
  // Handle contact info change
  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setCompany({
      ...company,
      contactInfo: {
        ...company.contactInfo,
        [name]: value,
      },
    });
  };
  
  // Handle logo change
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          logo: 'Logo size should be less than 5MB',
        });
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setErrors({
          ...errors,
          logo: 'Please upload a JPEG, PNG, or SVG file',
        });
        return;
      }
      
      setLogo(file);
      setLogoURL(URL.createObjectURL(file));
      setErrors({ ...errors, logo: null });
    }
  };
  
  // Upload logo
  const handleUploadLogo = async () => {
    if (logo) {
      setIsUploading(true);
      try {
        // First upload to Firebase Storage
        const uploadResult = await uploadFileWithAPI(
          logo,
          `company-logos/${user?.organization || 'default'}`,
          '/organizations/logo',
          { organizationId: user?.organization || 'default' },
          (progress) => {
            setUploadProgress(progress);
          }
        );
        
        if (uploadResult.success && uploadResult.fileUrl) {
          // Explicitly create an object with just the logo property
          // This ensures we only update this specific field
          const logoData = {
            logo: uploadResult.fileUrl
          };
          
          // Update Redux with the logo URL
          dispatch(uploadCompanyLogo(logoData));
          
          // Show success message
          setSnackbar({
            open: true,
            message: 'Logo uploaded successfully',
            severity: 'success',
          });
          
          // Clear the selected file (but keep the preview)
          setLogo(null);
        } else {
          // Handle error
          setSnackbar({
            open: true,
            message: uploadResult.error || 'Failed to upload logo',
            severity: 'error',
          });
        }
        
        setIsUploading(false);
        setUploadProgress(0);
      } catch (error) {
        console.error('Error uploading logo:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Failed to upload logo',
          severity: 'error',
        });
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a logo to upload',
        severity: 'warning',
      });
    }
  };
  
  // Submit company info update
  const handleSubmit = () => {
    // Basic validation for required fields only
    const newErrors = {};
    if (!company.name || company.name.trim() === '') {
      newErrors.name = 'Company name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSnackbar({
        open: true,
        message: 'Please fix the errors before submitting',
        severity: 'error',
      });
      return;
    }
    
    // Create a copy of the company data to avoid mutating state
    const companyDataToSubmit = JSON.parse(JSON.stringify(company));
    
    // Add metadata for the backend to identify which fields are explicitly set
    companyDataToSubmit._explicitlySet = true;
    
    // Dispatch the update action
    dispatch(updateCompanyInfo(companyDataToSubmit));
    
    // Show loading feedback
    setSnackbar({
      open: true,
      message: 'Saving organization information...',
      severity: 'info',
    });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Organization Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Logo Section */}
        <Grid lg={4} sm={12}>
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Company Logo
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  mt: 2 
                }}
              >
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    src={logoURL}
                    variant="rounded"
                    sx={{
                      width: 200,
                      height: 200,
                      border: '1px solid #f0f0f0',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 80 }} />
                  </Avatar>
                  <input
                    accept="image/*"
                    type="file"
                    id="logo-upload-input"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload-input">
                    <IconButton
                      component="span"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                        color: 'white',
                      }}
                    >
                      <CloudUploadIcon />
                    </IconButton>
                  </label>
                </Box>
                
                {errors.logo && (
                  <FormHelperText error>{errors.logo}</FormHelperText>
                )}
                
                {isUploading && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      size={24} 
                      sx={{ mb: 1 }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Uploading: {uploadProgress.toFixed(0)}%
                    </Typography>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  disabled={!logo || isUploading}
                  onClick={handleUploadLogo}
                  sx={{ mt: 2 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Recommended size: 200x200 px.<br />
                  Max size: 5MB. Formats: JPG, PNG, SVG
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Company Info Section */}
        <Grid lg={8} sm={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid sm={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={company.name}
                  onChange={handleBasicInfoChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sm={12}>
                <TextField
                  fullWidth
                  label="Company Description"
                  name="description"
                  value={company.description}
                  onChange={handleBasicInfoChange}
                  multiline
                  rows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <DescriptionIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Industry"
                  name="industry"
                  value={company.industry}
                  onChange={handleBasicInfoChange}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Established Year"
                  name="establishedYear"
                  value={company.establishedYear}
                  onChange={handleBasicInfoChange}
                  type="number"
                  inputProps={{
                    min: 1900,
                    max: new Date().getFullYear(),
                  }}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  name="gstNumber"
                  value={company.gstNumber}
                  onChange={handleBasicInfoChange}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="PAN Number"
                  name="panNumber"
                  value={company.panNumber}
                  onChange={handleBasicInfoChange}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Address Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid sm={12}>
                <TextField
                  fullWidth
                  label="Street Address"
                  name="street"
                  value={company.address.street}
                  onChange={handleAddressChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={company.address.city}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="state-select-label">State</InputLabel>
                  <Select
                    labelId="state-select-label"
                    label="State"
                    name="state"
                    value={company.address.state}
                    onChange={handleAddressChange}
                  >
                    {indianStates.map((state) => (
                      <MenuItem key={state} value={state}>
                        {state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="zipCode"
                  value={company.address.zipCode}
                  onChange={handleAddressChange}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={company.address.country}
                  onChange={handleAddressChange}
                  disabled
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={company.contactInfo.phone}
                  onChange={handleContactInfoChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={company.contactInfo.email}
                  onChange={handleContactInfoChange}
                />
              </Grid>
              <Grid sm={12}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={company.contactInfo.website}
                  onChange={handleContactInfoChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LanguageIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{ borderRadius: 2, px: 4 }}
            >
              {isLoading ? 'Saving...' : 'Save Organization Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
      
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

export default OrganizationSettings; 