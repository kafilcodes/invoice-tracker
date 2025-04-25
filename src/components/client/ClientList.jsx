import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchClients, 
  deleteClient, 
  setClientActiveStatus,
  searchClients,
  setCurrentClient
} from '../../redux/slices/clientSlice';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const ClientList = ({ onEdit = () => {} }) => {
  const dispatch = useDispatch();
  const { clients, status, error } = useSelector((state) => state.clients);
  const isLoading = status === 'loading';

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Fetch clients on component mount
  useEffect(() => {
    loadClients();
  }, [dispatch, showInactive]);

  // Load clients with current filter options
  const loadClients = () => {
    dispatch(fetchClients({ activeOnly: !showInactive }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Perform search
  const handleSearch = () => {
    if (searchTerm.trim()) {
      dispatch(searchClients({ 
        searchTerm, 
        options: { activeOnly: !showInactive }
      }));
    } else {
      loadClients();
    }
  };

  // Handle search on enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Toggle client active status
  const handleToggleStatus = (client) => {
    dispatch(setClientActiveStatus({
      clientId: client.id,
      isActive: !client.isActive
    }));
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  // Delete client after confirmation
  const confirmDelete = () => {
    if (clientToDelete) {
      dispatch(deleteClient(clientToDelete.id));
      closeDeleteDialog();
    }
  };

  // Handle edit client
  const handleEdit = (client) => {
    dispatch(setCurrentClient(client));
    onEdit(client);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Clients
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadClients}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
          </Box>
        </Box>

        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: isLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message || 'An error occurred while fetching clients'}
          </Alert>
        )}

        {!isLoading && clients.length === 0 ? (
          <Alert severity="info">
            No clients found. {searchTerm ? 'Try a different search term.' : 'Add your first client!'}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.company || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.isActive ? 'Active' : 'Inactive'}
                        color={client.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end">
                        <Tooltip title={client.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            onClick={() => handleToggleStatus(client)}
                            size="small"
                          >
                            {client.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleEdit(client)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => openDeleteDialog(client)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {clientToDelete?.name}? This action cannot be undone.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
            Warning: Deleting this client will also delete all associated invoices.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList; 