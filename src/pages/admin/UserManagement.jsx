import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert,
  TablePagination,
  FormHelperText,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
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
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { format } from 'date-fns';

// Firebase imports
import { rtdb } from '../../firebase/config';
import { registerWithEmailAndPassword } from '../../firebase/auth';

// User fetching function using Realtime Database
const fetchUsers = async () => {
  try {
    const usersSnapshot = await rtdb.getData("users");
    
    const users = [];
    if (usersSnapshot.exists) {
      const usersData = usersSnapshot.val();
      
      Object.entries(usersData).forEach(([uid, userData]) => {
        users.push({ _id: uid, ...userData });
      });
      
      // Sort by createdAt descending
      users.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    }
    
    return {
      users,
      total: users.length
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

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

const UserManagement = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showPassword, setShowPassword] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load users from Realtime Database
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetchUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load users: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'reviewer',
      active: true,
      isNew: true
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
        isNew: true
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
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        active: user.active,
        isNew: false
      }
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  // Open confirmation dialog for deleting user
  const handleDeleteConfirm = (user) => {
    setSelectedUser(user);
    setConfirmDelete(true);
  };

  // Delete user from Realtime Database
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      // Delete user from Realtime Database
      await rtdb.deleteData(`users/${selectedUser._id}`);
      
      // Update UI
      setUsers(users.filter(user => user._id !== selectedUser._id));
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete user: ' + error.message,
        severity: 'error'
      });
    } finally {
      setConfirmDelete(false);
      setSelectedUser(null);
      setLoading(false);
    }
  };

  // Save user (create or update)
  const handleSaveUser = async (values) => {
    setLoading(true);
    try {
      if (dialogMode === 'add') {
        // Register new user with Firebase Auth
        const result = await registerWithEmailAndPassword({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role
        });
        
        if (!result.success) {
          throw new Error(result.error.message);
        }
        
        // Update UI with new user
        const newUser = {
          _id: result.user.uid,
          name: values.name,
          email: values.email,
          role: values.role,
          active: values.active,
          createdAt: new Date().toISOString()
        };
        
        setUsers([newUser, ...users]);
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      } else {
        // Update existing user in Realtime Database
        const updates = {
          name: values.name,
          role: values.role,
          active: values.active,
          updatedAt: new Date().toISOString()
        };
        
        await rtdb.updateData(`users/${values._id}`, updates);
        
        // Update UI with edited user
        setUsers(users.map(user => 
          user._id === values._id 
            ? { ...user, ...updates } 
            : user
        ));
        
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        });
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save user: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Get role chip
  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return (
          <Chip
            icon={<AdminIcon sx={{ fontSize: 16 }} />}
            label="Admin"
            color="primary"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'reviewer':
        return (
          <Chip
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            label="Reviewer"
            color="success"
            size="small"
          />
        );
      default:
        return (
          <Chip
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            label="Reviewer"
            color="success"
            size="small"
          />
        );
    }
  };

  // Get status chip
  const getStatusChip = (active) => {
    return active ? (
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
        color="error"
        size="small"
      />
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          User Management
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          <Tooltip title="Refresh">
            <IconButton onClick={loadUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user._id} hover>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>{getStatusChip(user.active)}</TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleEditUser(user)}
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDeleteConfirm(user)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                margin="dense"
              />
              
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                margin="dense"
              />
              
              <TextField
                fullWidth
                id="password"
                name="password"
                label={dialogMode === 'add' ? 'Password' : 'New Password (leave empty to keep current)'}
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                margin="dense"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl 
                fullWidth 
                margin="dense"
                error={formik.touched.role && Boolean(formik.errors.role)}
              >
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  label="Role"
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="reviewer">Reviewer</MenuItem>
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <FormHelperText>{formik.errors.role}</FormHelperText>
                )}
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.active}
                    onChange={(e) => formik.setFieldValue('active', e.target.checked)}
                    name="active"
                    color="primary"
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!formik.isValid || formik.isSubmitting}
            >
              {dialogMode === 'add' ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
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
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement; 