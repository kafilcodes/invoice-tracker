import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Container, Typography, Button, Divider, Grid, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ClientList from '../components/client/ClientList';
import ClientForm from '../components/client/ClientForm';
import { clearCurrentClient } from '../redux/slices/clientSlice';

const ClientsPage = () => {
  const dispatch = useDispatch();
  const { currentClient } = useSelector((state) => state.clients);
  const [showForm, setShowForm] = useState(false);

  // Handle form visibility
  const toggleForm = () => {
    if (showForm && currentClient) {
      dispatch(clearCurrentClient());
    }
    setShowForm(!showForm);
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setShowForm(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    dispatch(clearCurrentClient());
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    dispatch(clearCurrentClient());
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Clients
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your client information and view their invoices
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color={showForm ? "secondary" : "primary"}
              startIcon={showForm ? null : <AddIcon />}
              onClick={toggleForm}
            >
              {showForm ? "Cancel" : "Add Client"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {showForm && (
        <Box sx={{ mb: 4 }}>
          <ClientForm 
            client={currentClient}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Box>
      )}

      <ClientList onEdit={handleEditClient} />
    </Container>
  );
};

export default ClientsPage; 