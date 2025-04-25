import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Fab,
  Switch,
  LinearProgress
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  AlternateEmail as EmailIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { getProfile, updateProfile, uploadProfilePicture, resetProfile, updateProfileLocal } from '../redux/slices/profileSlice';
import { uploadFile } from '../firebase/storage';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import realtimeDb from '../firebase/realtimeDatabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const { profileData, isLoading, isSuccess, isError, message } = useSelector((state) => state.profile);
  const isReviewer = user?.role === 'reviewer';
  
  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  
  // Form states
  const [profileInfo, setProfileInfo] = useState({
    name: '',
    phone: '',
    jobTitle: '',
    department: '',
    organization: '',
  });
  
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureURL, setProfilePictureURL] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form errors
  const [errors, setErrors] = useState({});
  const [showAdminRequestSuccess, setShowAdminRequestSuccess] = useState(false);
  
  // Load profile data on component mount
  useEffect(() => {
    if (user && user.uid) {
      fetchUserProfile(user.uid);
    }
  }, [user]);
  
  // Fetch user profile from Realtime Database
  const fetchUserProfile = async (uid) => {
    try {
      const response = await realtimeDb.getUserProfile(uid);
      
      if (response.success && response.data) {
        // Set profile data
        setProfileInfo({
          name: response.data.displayName || user?.displayName || '',
          phone: response.data.phone || '',
          jobTitle: response.data.jobTitle || '',
          department: response.data.department || '',
          organization: response.data.organization || '',
        });
        
        if (response.data.photoURL || user?.photoURL) {
          setProfilePictureURL(response.data.photoURL || user?.photoURL);
        }
        
        // Update in Redux store
        dispatch(updateProfileLocal({
          name: response.data.displayName || user?.displayName || '',
          phone: response.data.phone || '',
          jobTitle: response.data.jobTitle || '',
          department: response.data.department || '',
          profilePicture: response.data.photoURL || user?.photoURL,
          organization: response.data.organization || ''
        }));
      } else {
        // Fallback to user data from auth state
        setProfileInfo({
          name: user.displayName || '',
          phone: user.phoneNumber || '',
          jobTitle: user.jobTitle || '',
          department: user.department || '',
        });
        
        if (user.photoURL) {
          setProfilePictureURL(user.photoURL);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data');
    }
  };
  
  // Handle profile info change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo({ ...profileInfo, [name]: value });
    
    // Clear any field-specific errors when user edits a field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // If turning off edit mode without saving, reset the form
      fetchUserProfile(user.uid);
    }
    setEditMode(!editMode);
  };
  
  // Handle profile picture change
  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('Image is too large. Maximum size is 5MB');
        return;
      }
      
      setProfilePicture(file);
      // Create a preview URL
      setProfilePictureURL(URL.createObjectURL(file));
      
      // Automatically upload when a file is selected
      uploadProfileImage(file);
    }
  };
  
  // Upload profile picture directly to Firebase Storage
  const uploadProfileImage = async (file) => {
    if (!user || !user.uid) {
      toast.error('User ID not available. Please log in again.');
      return;
    }
    
    if (!file) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a storage reference
      const storageRef = ref(storage, `users/${user.uid}/profile-picture`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          // Handle upload error
          console.error('Upload error:', error);
          toast.error('Failed to upload profile picture');
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update Realtime Database
          const updateResponse = await realtimeDb.updateUserProfile(user.uid, {
            photoURL: downloadURL,
            updatedAt: new Date().toISOString()
          });
          
          if (updateResponse.success) {
            // Update Redux store
            dispatch(uploadProfilePicture({ profilePicture: downloadURL }));
            
            // Update local state
            setProfilePictureURL(downloadURL);
            setProfilePicture(null);
            
            toast.success('Profile picture updated successfully');
          } else {
            toast.error('Failed to update profile picture');
          }
          
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(error.message || 'Failed to upload profile picture');
      setIsUploading(false);
    }
  };
  
  // Submit profile info update
  const handleProfileSubmit = async () => {
    // Check if user is logged in
    if (!user || !user.uid) {
      toast.error('User ID not available. Please log in again.');
      return;
    }
    
    // Form validation
    const newErrors = {};
    
    if (!profileInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      // Update in Realtime Database
      const updatedFields = {
        displayName: profileInfo.name,
        updatedAt: new Date().toISOString()
      };
      
      // Only include changed fields
      if (profileInfo.phone !== profileData?.phone && profileInfo.phone !== '') {
        updatedFields.phone = profileInfo.phone;
      }
      
      if (profileInfo.jobTitle !== profileData?.jobTitle && profileInfo.jobTitle !== '') {
        updatedFields.jobTitle = profileInfo.jobTitle;
      }
      
      if (profileInfo.department !== profileData?.department && profileInfo.department !== '') {
        updatedFields.department = profileInfo.department;
      }
      
      const response = await realtimeDb.updateUserProfile(user.uid, updatedFields);
      
      if (response.success) {
        // Update in Redux store
        dispatch(updateProfileLocal({
          name: profileInfo.name,
          phone: profileInfo.phone,
          jobTitle: profileInfo.jobTitle,
          department: profileInfo.department,
          organization: profileInfo.organization
        }));
        
        toast.success('Profile updated successfully');
        setEditMode(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };
  
  const handleAvatarClick = () => {
    if (editMode) {
      fileInputRef.current.click();
    }
  };
  
  const handleRequestAdminRole = () => {
    // Create email to request admin access
    const subject = encodeURIComponent("Request to upgrade to admin role");
    const body = encodeURIComponent(`
      User is requesting to be upgraded to admin role.
      User ID: ${user?.uid || 'Not available'}
      Name: ${user?.displayName || profileInfo.name || 'Not available'}
      Email: ${user?.email || 'Not available'}
      Current Role: ${user?.role || 'Not available'}
    `);
    
    window.open(`mailto:kafilkhan0270@gmail.com?subject=${subject}&body=${body}`);
    toast.success("Admin request sent successfully!");
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Profile
        </Typography>
        
        {user?.role !== 'admin' && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AdminIcon />}
            onClick={handleRequestAdminRole}
          >
            Request Admin Access
          </Button>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Profile Picture Card */}
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              position: 'relative'
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profilePictureURL}
                alt={profileInfo.name || user?.displayName || 'User'}
                sx={{
                  width: 150,
                  height: 150,
                  border: '3px solid',
                  borderColor: 'primary.main',
                  boxShadow: 3,
                  cursor: editMode ? 'pointer' : 'default',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: editMode ? 'scale(1.05)' : 'none'
                  }
                }}
                onClick={handleAvatarClick}
              >
                {!profilePictureURL && <PersonIcon sx={{ fontSize: 80 }} />}
              </Avatar>
              
              {editMode && (
                <Tooltip title="Change profile picture">
                  <IconButton
                    color="primary"
                    onClick={handleAvatarClick}
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
                    <CameraIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </Box>
            
            {isUploading && (
              <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="body2" align="center" sx={{ mb: 1 }}>
                  {Math.round(uploadProgress)}% uploaded
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            )}
            
            <Typography variant="h5" sx={{ mt: 3, fontWeight: 'bold' }}>
              {profileInfo.name || user?.displayName || 'User Name'}
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                mt: 1
              }}
            >
              <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
              {user?.email || 'user@example.com'}
            </Typography>
            
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mt: 1
              }}
            >
              <AdminIcon sx={{ mr: 1, fontSize: 18 }} />
              {user?.role === 'admin' ? 'Administrator' : 'Reviewer'}
            </Typography>
            
            {profileInfo.organization && (
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mt: 1
                }}
              >
                <BusinessIcon sx={{ mr: 1, fontSize: 18 }} />
                {profileInfo.organization}
              </Typography>
            )}
            
            {profileInfo.department && (
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  mt: 1
                }}
              >
                <PeopleIcon sx={{ mr: 1, fontSize: 18 }} />
                {profileInfo.department}
              </Typography>
            )}
            
            <Box
              sx={{
                mt: 2,
                p: 1,
                borderRadius: 1,
                backgroundColor: user?.role === 'admin' ? 'error.main' : 'secondary.main',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: 12,
                letterSpacing: 1
              }}
            >
              {user?.role || 'User'}
            </Box>
            
            <Button
              variant={editMode ? "contained" : "outlined"}
              color={editMode ? "primary" : "secondary"}
              startIcon={editMode ? <SaveIcon /> : <EditIcon />}
              sx={{ mt: 4, width: '100%' }}
              onClick={editMode ? handleProfileSubmit : toggleEditMode}
              disabled={isLoading}
            >
              {editMode ? 'Save Changes' : 'Edit Profile'}
            </Button>
            
            {editMode && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CloseIcon />}
                sx={{ mt: 2, width: '100%' }}
                onClick={toggleEditMode}
              >
                Cancel
              </Button>
            )}
          </Card>
        </Grid>
        
        {/* Profile Info Card */}
        <Grid item xs={12} md={8}>
          <Card 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="h5" fontWeight="bold">
                  Personal Information
                </Typography>
                <Typography variant="body2">
                  Manage your personal information and preferences
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={profileInfo.name || ''}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      error={!!errors.name}
                      helperText={errors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: editMode ? 'background.paper' : 'action.hover',
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profileInfo.phone || ''}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: editMode ? 'background.paper' : 'action.hover',
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* Job Title */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      name="jobTitle"
                      value={profileInfo.jobTitle || ''}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      error={!!errors.jobTitle}
                      helperText={errors.jobTitle}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: editMode ? 'background.paper' : 'action.hover',
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* Department */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      name="department"
                      value={profileInfo.department || ''}
                      onChange={handleProfileChange}
                      disabled={!editMode}
                      error={!!errors.department}
                      helperText={errors.department}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: editMode ? 'background.paper' : 'action.hover',
                        }
                      }}
                    />
                  </Grid>
                  
                  {/* Organization */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Organization"
                      name="organization"
                      value={profileInfo.organization || ''}
                      onChange={handleProfileChange}
                      disabled={true}
                      error={!!errors.organization}
                      helperText={errors.organization || "Organization cannot be changed"}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon />
                          </InputAdornment>
                        ),
                        readOnly: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'action.hover',
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 4 }} />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Account Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={user?.email || 'Not available'}
                        disabled
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Account Type"
                        value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Regular User'}
                        disabled
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={showAdminRequestSuccess}
        autoHideDuration={6000}
        onClose={() => setShowAdminRequestSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowAdminRequestSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Admin access request has been sent successfully!
        </Alert>
      </Snackbar>
      
      <ToastContainer position="top-right" />
    </Box>
  );
};

export default Profile; 