import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Switch, 
  FormControlLabel, 
  Button, 
  Grid, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  TextField,
  IconButton,
  Avatar,
  useTheme,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import { 
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const Settings = () => {
  const theme = useTheme();
  const user = useSelector(selectUser);
  const [currentTab, setCurrentTab] = useState(0);
  const [darkMode, setDarkMode] = useState(theme.palette.mode === 'dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSaveSettings = () => {
    // Here you would save settings to your backend
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const tabs = [
    { label: 'General', icon: <PaletteIcon /> },
    { label: 'Notifications', icon: <NotificationsIcon /> },
    { label: 'Security', icon: <SecurityIcon /> },
    { label: 'Profile', icon: <EditIcon /> }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: '100%' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography variant="h4" fontWeight="bold" gutterBottom mb={4}>
            Settings
          </Typography>
        </motion.div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: { xs: 3, md: 0 }, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h6" fontWeight="medium">Settings</Typography>
                </Box>
                <Tabs
                  orientation="vertical"
                  variant="scrollable"
                  value={currentTab}
                  onChange={handleTabChange}
                  sx={{ 
                    borderRight: 1, 
                    borderColor: 'divider',
                    '& .MuiTab-root': {
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      py: 2
                    }
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab 
                      key={index} 
                      label={tab.label} 
                      icon={tab.icon} 
                      iconPosition="start"
                      sx={{ 
                        minHeight: 60, 
                        fontWeight: currentTab === index ? 'bold' : 'normal'
                      }}
                    />
                  ))}
                </Tabs>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={9}>
            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  minHeight: 600,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* General Settings */}
                {currentTab === 0 && (
                  <Box>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Appearance & Localization
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ mb: 3, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center">
                                {darkMode ? <DarkModeIcon sx={{ mr: 1 }} /> : <LightModeIcon sx={{ mr: 1 }} />}
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                                </Typography>
                              </Box>
                              <Switch
                                checked={darkMode}
                                onChange={() => setDarkMode(!darkMode)}
                                color="primary"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                              {darkMode
                                ? 'Turn off dark mode to use light theme'
                                : 'Turn on dark mode to reduce eye strain in low light'}
                            </Typography>
                          </CardContent>
                        </Card>

                        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                          <InputLabel>Language</InputLabel>
                          <Select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            label="Language"
                            startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
                          >
                            <MenuItem value="en">English</MenuItem>
                            <MenuItem value="es">Spanish</MenuItem>
                            <MenuItem value="fr">French</MenuItem>
                            <MenuItem value="de">German</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                          <InputLabel>Currency</InputLabel>
                          <Select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            label="Currency"
                          >
                            <MenuItem value="USD">US Dollar ($)</MenuItem>
                            <MenuItem value="EUR">Euro (€)</MenuItem>
                            <MenuItem value="GBP">British Pound (£)</MenuItem>
                            <MenuItem value="JPY">Japanese Yen (¥)</MenuItem>
                          </Select>
                        </FormControl>

                        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                          <InputLabel>Date Format</InputLabel>
                          <Select
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            label="Date Format"
                          >
                            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Notification Settings */}
                {currentTab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Notification Preferences
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Card sx={{ mb: 3, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight="medium">
                            Email Notifications
                          </Typography>
                          <Switch
                            checked={emailNotifications}
                            onChange={() => setEmailNotifications(!emailNotifications)}
                            color="primary"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Receive email notifications about invoice approvals, rejections, and new assignments
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Card sx={{ mb: 3, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight="medium">
                            Push Notifications
                          </Typography>
                          <Switch
                            checked={pushNotifications}
                            onChange={() => setPushNotifications(!pushNotifications)}
                            color="primary"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Receive browser notifications when actions require your attention
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                )}

                {/* Security Settings */}
                {currentTab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Security Settings
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Card sx={{ mb: 3, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight="medium">
                            Two-Factor Authentication
                          </Typography>
                          <Switch
                            checked={twoFactorAuth}
                            onChange={() => setTwoFactorAuth(!twoFactorAuth)}
                            color="primary"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Add an extra layer of security to your account
                        </Typography>
                      </CardContent>
                    </Card>
                    
                    <Typography variant="subtitle1" fontWeight="medium" mt={3} mb={2}>
                      Change Password
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Current Password"
                          type="password"
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="New Password"
                          type="password"
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Confirm New Password"
                          type="password"
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />}>
                          Update Password
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Profile Settings */}
                {currentTab === 3 && (
                  <Box>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Profile Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" mb={4}>
                      <Box position="relative" mr={{ xs: 0, sm: 3 }} mb={{ xs: 3, sm: 0 }}>
                        <Avatar
                          src={user?.photoURL}
                          alt={user?.displayName}
                          sx={{ width: 100, height: 100 }}
                        />
                        <IconButton
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box>
                        <Typography variant="h6">{user?.displayName || 'User Name'}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user?.email || 'user@example.com'}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                          {user?.role || 'Reviewer'} Account
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Full Name"
                          defaultValue={user?.displayName || ''}
                          fullWidth
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Email Address"
                          defaultValue={user?.email || ''}
                          fullWidth
                          variant="outlined"
                          margin="normal"
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Phone Number"
                          defaultValue={user?.phoneNumber || ''}
                          fullWidth
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Company"
                          defaultValue={user?.company || ''}
                          fullWidth
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Bio"
                          defaultValue={user?.bio || ''}
                          fullWidth
                          multiline
                          rows={4}
                          variant="outlined"
                          margin="normal"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <Box display="flex" justifyContent="flex-end" mt={4}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSaveSettings}
                    startIcon={<SaveIcon />}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Box>
  );
};

export default Settings; 