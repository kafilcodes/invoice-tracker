import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Avatar,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  Tooltip,
  LinearProgress,
  FormHelperText,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper as MuiPaper
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import databaseService from '../../firebase/database';
import { registerWithEmailAndPassword } from '../../firebase/auth';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { format } from 'date-fns';

// Validation schema for organization
const organizationValidationSchema = Yup.object({
  name: Yup.string().required('Organization name is required'),
  email: Yup.string().email('Invalid email format').required('Email is required'),
  phone: Yup.string().required('Phone number is required'),
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zip: Yup.string().required('ZIP code is required'),
  country: Yup.string().required('Country is required')
});

// Validation schema for user form
const userValidationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .when('isNew', {
      is: true,
      then: (schema) => schema.required('Password is required'),
      otherwise: (schema) => schema
    }),
  role: Yup.string()
    .required('Role is required')
    .oneOf(['admin', 'reviewer'], 'Role must be admin or reviewer'),
  active: Yup.boolean()
});

const Organization = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);
  
  // Tabs state
  const [activeTab, setActiveTab] = useState(0);
  
  // Organization state
  const [organization, setOrganization] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    website: '',
    description: '',
    logo: null
  });
  
  // Logo upload state
  const [logo, setLogo] = useState(null);
  const [logoURL, setLogoURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // User management state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load organization data and users on component mount
  useEffect(() => {
    loadOrganizationData();
    loadUsers();
  }, []);
  
  // Load organization data from database
  const loadOrganizationData = async () => {
    try {
      if (!user?.uid) return;
      
      // Get user's organization ID
      const userDataResult = await databaseService.getData(`users/${user.uid}`);
      
      if (userDataResult.success && userDataResult.data?.organization) {
        const organizationId = userDataResult.data.organization;
        
        // Get organization details
        const orgResult = await databaseService.getData(`organizations/${organizationId}`);
        
        if (orgResult.success && orgResult.data) {
          const orgData = orgResult.data;
          setOrganization({
            id: organizationId,
            name: orgData.name || '',
            email: orgData.email || '',
            phone: orgData.phone || '',
            address: orgData.address || '',
            city: orgData.city || '',
            state: orgData.state || '',
            zip: orgData.zip || '',
            country: orgData.country || 'India',
            website: orgData.website || '',
            description: orgData.description || ''
          });
          
          if (orgData.logo) {
            setLogoURL(orgData.logo);
          }
        }
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load organization data',
        severity: 'error'
      });
    }
  };
  
  // Function to load users from the organization
  const loadUsers = async () => {
    setLoading(true);
    try {
      if (!user?.uid) return;
      
      // Get user's organization ID
      const userDataResult = await databaseService.getData(`users/${user.uid}`);
      
      if (userDataResult.success && userDataResult.data?.organization) {
        const organizationId = userDataResult.data.organization;
        
        // Get all members in the organization
        const membersResult = await databaseService.getData(`organizations/${organizationId}/members`);
        
        if (membersResult.success && membersResult.data) {
          const membersData = membersResult.data;
          const usersList = [];
          const userFetchPromises = [];
          
          // Process each member ID from the organization's members collection
          for (const [userId, memberData] of Object.entries(membersData)) {
            // Skip the current user
            if (userId !== user.uid) {
              // Create a promise for fetching user data
              const userFetchPromise = databaseService.getData(`users/${userId}`)
                .then(userDataResult => {
                  if (userDataResult.success && userDataResult.data) {
                    // Prioritize data from users collection, fall back to member data when needed
                    const userData = userDataResult.data;
                    
                    return {
                      _id: userId,
                      name: userData.displayName || userData.name || (memberData && memberData.displayName),
                      email: userData.email || (memberData && memberData.email),
                      role: userData.role || (memberData && memberData.role),
                      active: userData.active !== false,
                      profilePicture: userData.photoURL || userData.profilePicture || (memberData && memberData.profilePicture) || (memberData && memberData.photoURL),
                      department: userData.department,
                      // Add any organization-specific data from memberData
                      memberSince: memberData?.createdAt || userData.createdAt,
                      // Include any other relevant fields
                    };
                  }
                  // If user data fetch fails, try to use member data as fallback
                  else if (memberData) {
                    console.warn(`Could not fetch user data for ${userId}, using member data as fallback`);
                    return {
                      _id: userId,
                      name: memberData.displayName || 'Unknown User',
                      email: memberData.email || 'No email',
                      role: memberData.role || 'Unknown',
                      active: memberData.active !== false,
                      profilePicture: memberData.photoURL || memberData.profilePicture,
                      memberSince: memberData.createdAt,
                    };
                  }
                  // If both user and member data are unavailable, return null to filter out later
                  else {
                    console.warn(`No data available for user ${userId}`);
                    return null;
                  }
                })
                .catch(error => {
                  console.error(`Error fetching user data for ${userId}:`, error);
                  // Return null if fetch fails
                  return null;
                });
              
              userFetchPromises.push(userFetchPromise);
            }
          }
          
          // Wait for all user data fetch operations to complete
          const users = await Promise.all(userFetchPromises);
          
          // Filter out any null values (failed fetches) and sort by name
          const validUsers = users.filter(u => u !== null);
          validUsers.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
          });
          
          // Log user data for debugging
          console.log('Loaded users with profile pictures:', validUsers.map(u => ({
            id: u._id,
            name: u.name,
            profilePic: u.profilePicture || 'none'
          })));
          
          setUsers(validUsers);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load users: ' + (error.message || 'Unknown error'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle organization form field change
  const handleOrgFieldChange = (e) => {
    const { name, value } = e.target;
    setOrganization({
      ...organization,
      [name]: value
    });
  };
  
  // Handle logo change
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSnackbar({
          open: true,
          message: 'Please select an image file',
          severity: 'error'
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size should be less than 5MB',
          severity: 'error'
        });
        return;
      }
      
      setLogo(file);
      setLogoURL(URL.createObjectURL(file));
      
      // Upload logo immediately
      handleUploadLogo(file);
    }
  };
  
  // Upload logo to Firebase Storage
  const handleUploadLogo = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create storage reference
      const storageRef = ref(storage, `organizations/${organization.id}/logo`);
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading logo:', error);
          setSnackbar({
            open: true,
            message: 'Failed to upload logo',
            severity: 'error'
          });
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update organization record in database
          const updateResult = await databaseService.updateData(`organizations/${organization.id}`, {
            logo: downloadURL
          });
          
          if (updateResult.success) {
            setLogoURL(downloadURL);
            setSnackbar({
              open: true,
              message: 'Logo uploaded successfully',
              severity: 'success'
            });
          } else {
            setSnackbar({
              open: true,
              message: 'Failed to update organization with new logo',
              severity: 'error'
            });
          }
          
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error('Error uploading logo:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload logo',
        severity: 'error'
      });
      setIsUploading(false);
    }
  };
  
  // Save organization details
  const handleSaveOrganization = async () => {
    try {
      // Basic validation
      if (!organization.name || !organization.email) {
        setSnackbar({
          open: true,
          message: 'Organization name and email are required',
          severity: 'error'
        });
        return;
      }
      
      // Update organization in database
      const updateResult = await databaseService.updateData(`organizations/${organization.id}`, {
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        zip: organization.zip,
        country: organization.country,
        website: organization.website,
        description: organization.description,
        updatedAt: new Date().toISOString()
      });
      
      if (updateResult.success) {
        setSnackbar({
          open: true,
          message: 'Organization details updated successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to update organization details',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save organization details',
        severity: 'error'
      });
    }
  };
  
  // Initialize formik for user form
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'reviewer',
      active: true,
      isNew: true,
      organization: organization.id
    },
    validationSchema: userValidationSchema,
    onSubmit: (values) => {
      handleSaveUser(values);
    }
  });
  
  // Open dialog for adding new user
  const handleAddUser = () => {
    formik.resetForm({
      values: {
        name: '',
        email: '',
        password: '',
        role: 'reviewer',
        active: true,
        isNew: true,
        organization: organization.id
      }
    });
    setDialogMode('add');
    setOpenDialog(true);
  };
  
  // Open dialog for editing user
  const handleEditUser = (user) => {
    formik.resetForm({
      values: {
        _id: user._id,
        name: user.name || user.displayName,
        email: user.email,
        password: '',
        role: user.role || 'reviewer',
        active: user.active !== false,
        isNew: false,
        organization: organization.id
      }
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };
  
  // Open confirmation dialog for deleting user
  const handleConfirmDeleteUser = (user) => {
    setSelectedUser(user);
    setConfirmDelete(true);
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      if (!selectedUser || !selectedUser._id) {
        throw new Error('No user selected for deletion');
      }
      
      // Get organization ID
      const userDataResult = await databaseService.getData(`users/${user.uid}`);
      if (!userDataResult.success || !userDataResult.data?.organization) {
        throw new Error('Failed to get organization information');
      }
      
      const organizationId = userDataResult.data.organization;
      const userId = selectedUser._id;
      
      // Track all deletion operations for better error reporting
      const deletionResults = [];
      
      // 1. Remove user from organization members collection
      const removeFromOrgResult = await databaseService.removeData(`organizations/${organizationId}/members/${userId}`);
      deletionResults.push({ 
        operation: 'Remove from members',
        success: removeFromOrgResult.success,
        error: removeFromOrgResult.success ? null : 'Failed to remove from members collection'
      });
      
      // 2. Complete deletion from users collection
      const deleteUserResult = await databaseService.removeData(`users/${userId}`);
      deletionResults.push({ 
        operation: 'Delete user profile',
        success: deleteUserResult.success,
        error: deleteUserResult.success ? null : 'Failed to delete user from users collection'
      });
      
      // 3. Try to remove user from Firebase Auth (admin-only operation)
      let authDeletionResult = { success: false, error: 'Not attempted' };
      try {
        const deleteAuthResult = await fetch('/api/admin/users/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId
          })
        });
        
        if (deleteAuthResult.ok) {
          authDeletionResult = { success: true, error: null };
        } else {
          const errorData = await deleteAuthResult.json();
          authDeletionResult = { 
            success: false, 
            error: errorData.message || 'Unknown error during auth deletion'
          };
          console.warn('Warning: Could not delete user from auth system:', errorData.message);
        }
      } catch (authError) {
        authDeletionResult = { success: false, error: authError.message };
        console.warn('Warning: Could not delete user from auth system:', authError);
      }
      deletionResults.push({ 
        operation: 'Delete authentication', 
        ...authDeletionResult 
      });
      
      // Check for any failures and determine message
      const failures = deletionResults.filter(r => !r.success);
      
      if (failures.length === 0) {
        // All operations succeeded
        setSnackbar({
          open: true,
          message: 'User deleted successfully from all systems',
          severity: 'success'
        });
      } else if (failures.length < deletionResults.length) {
        // Partial success
        console.warn('Partial user deletion. Results:', deletionResults);
        setSnackbar({
          open: true,
          message: 'User partially deleted. Some operations failed.',
          severity: 'warning'
        });
      } else {
        // Complete failure
        throw new Error('Failed to delete user from any system');
      }
      
      // Refresh user list
      loadUsers();
      
      // Close the confirmation dialog
      setConfirmDelete(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete user: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save user
  const handleSaveUser = async (values) => {
    try {
      if (values.isNew) {
        // Register new user
        const registerResponse = await registerWithEmailAndPassword(
          values.email,
          values.password,
          {
            displayName: values.name,
            role: values.role,
            organization: organization.id
          }
        );
        
        if (registerResponse.success) {
          // Add user to organization
          const newUserId = registerResponse.user.uid;
          await databaseService.setData(`organizations/${organization.id}/users/${newUserId}`, {
            uid: newUserId,
            displayName: values.name,
            email: values.email,
            role: values.role,
            active: values.active,
            createdAt: new Date().toISOString(),
            createdBy: user.uid
          });
          
          // Refresh user list
          loadUsers();
          
          setSnackbar({
            open: true,
            message: 'User added successfully',
            severity: 'success'
          });
        } else {
          throw new Error(registerResponse.error || 'Failed to register user');
        }
      } else {
        // Update existing user
        const updateData = {
          displayName: values.name,
          role: values.role,
          active: values.active,
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid
        };
        
        const updateResult = await databaseService.updateData(`organizations/${organization.id}/users/${values._id}`, updateData);
        
        if (updateResult.success) {
          // Also update main user record
          await databaseService.updateData(`users/${values._id}`, {
            displayName: values.name,
            role: values.role
          });
          
          // Refresh user list
          loadUsers();
          
          setSnackbar({
            open: true,
            message: 'User updated successfully',
            severity: 'success'
          });
        } else {
          throw new Error('Failed to update user');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: `Failed to save user: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDialog(false);
    }
  };
  
  // Handle search change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };
  
  // Get role chip
  const getRoleChip = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <Chip
            icon={<AdminIcon />}
            label="Admin"
            color="error"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'reviewer':
        return (
          <Chip
            icon={<PersonIcon />}
            label="Reviewer"
            color="primary"
            size="small"
          />
        );
      default:
        return (
          <Chip
            icon={<PersonIcon />}
            label={role || 'Unknown'}
            color="default"
            size="small"
          />
        );
    }
  };
  
  // Get status chip
  const getStatusChip = (active) => {
    return active !== false ? (
      <Chip
        icon={<CheckCircleIcon />}
        label="Active"
        color="success"
        size="small"
      />
    ) : (
      <Chip
        icon={<CancelIcon />}
        label="Inactive"
        color="default"
        size="small"
      />
    );
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Organization Management
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Organization Details" />
          <Tab label="User Management" />
        </Tabs>
        
        {/* Organization Details Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Organization Logo */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Avatar
                      src={logoURL}
                      alt={organization.name}
                      sx={{
                        width: 150,
                        height: 150,
                        border: '3px solid',
                        borderColor: 'primary.main',
                        boxShadow: 3
                      }}
                    >
                      {!logoURL && <BusinessIcon sx={{ fontSize: 80 }} />}
                    </Avatar>
                    
                    <IconButton
                      color="primary"
                      onClick={() => fileInputRef.current.click()}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': {
                          backgroundColor: 'background.default'
                        }
                      }}
                    >
                      <CloudUploadIcon />
                    </IconButton>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </Box>
                  
                  {isUploading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography variant="body2" align="center" sx={{ mb: 1 }}>
                        {Math.round(uploadProgress)}% uploaded
                      </Typography>
                      <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                  )}
                  
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold', textAlign: 'center' }}>
                    {organization.name || 'Organization Name'}
                  </Typography>
                  
                  {organization.website && (
                    <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <LanguageIcon sx={{ mr: 1, fontSize: 16 }} />
                      {organization.website}
                    </Typography>
                  )}
                </Card>
              </Grid>
              
              {/* Organization Details Form */}
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                      Organization Details
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Organization Name"
                          name="name"
                          value={organization.name || ''}
                          onChange={handleOrgFieldChange}
                          disabled={true}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon />
                              </InputAdornment>
                            )
                          }}
                          helperText="Organization name cannot be changed"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={organization.email || ''}
                          onChange={handleOrgFieldChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="phone"
                          value={organization.phone || ''}
                          onChange={handleOrgFieldChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Website"
                          name="website"
                          value={organization.website || ''}
                          onChange={handleOrgFieldChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LanguageIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="address"
                          value={organization.address || ''}
                          onChange={handleOrgFieldChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="City"
                          name="city"
                          value={organization.city || ''}
                          onChange={handleOrgFieldChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="State"
                          name="state"
                          value={organization.state || ''}
                          onChange={handleOrgFieldChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="ZIP Code"
                          name="zip"
                          value={organization.zip || ''}
                          onChange={handleOrgFieldChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          name="description"
                          value={organization.description || ''}
                          onChange={handleOrgFieldChange}
                          multiline
                          rows={3}
                        />
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveOrganization}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* User Management Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                Users in {organization.name}
              </Typography>
              
              <TextField
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No users found in this organization.
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ overflow: 'hidden' }}>
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                  <List>
                    {users
                      .filter(u => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          (u.name && u.name.toLowerCase().includes(searchLower)) ||
                          (u.email && u.email.toLowerCase().includes(searchLower)) ||
                          (u.department && u.department.toLowerCase().includes(searchLower))
                        );
                      })
                      .map(user => (
                        <ListItem
                          key={user._id}
                          secondaryAction={
                            <Tooltip title="Delete User">
                              <IconButton 
                                edge="end" 
                                color="error"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setConfirmDelete(true);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          }
                          divider
                        >
                          <ListItemAvatar>
                            <Avatar 
                              src={user.profilePicture} 
                              alt={user.name}
                              key={`avatar-${user._id}-${user.profilePicture || 'no-pic'}`}
                              sx={{ bgcolor: user.role === 'admin' ? 'error.main' : 'primary.main' }}
                            >
                              {user.name ? user.name[0].toUpperCase() : 'U'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {user.name || 'Unknown User'}
                                </Typography>
                                {getRoleChip(user.role)}
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Typography component="span" variant="body2" color="text.secondary" display="block">
                                  {user.email}
                                </Typography>
                                {user.department && (
                                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                                    Department: {user.department}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              </Paper>
            )}
            
            {/* Delete User Confirmation Dialog */}
            <Dialog
              open={confirmDelete}
              onClose={() => setConfirmDelete(false)}
            >
              <DialogTitle>Confirm User Deletion</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete user <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
                  <Typography color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
                    This action will permanently remove the user from your organization and delete their account.
                    It cannot be undone.
                  </Typography>
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button 
                  onClick={handleDeleteUser} 
                  color="error" 
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
                >
                  Delete User
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default Organization; 