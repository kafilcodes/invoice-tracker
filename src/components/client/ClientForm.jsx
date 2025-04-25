import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createClient, updateClient } from '../../redux/slices/clientSlice';
import { Box, Button, TextField, Grid, Typography, Paper, Alert, CircularProgress } from '@mui/material';

const ClientForm = ({ client = null, onSuccess = () => {}, onCancel = () => {} }) => {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.clients);
  const isLoading = status === 'loading';
  const isEditMode = !!client;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    taxId: '',
    notes: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Set initial form data if client is provided
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        company: client.company || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        taxId: client.taxId || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode) {
        await dispatch(updateClient({ 
          clientId: client.id, 
          updateData: formData 
        })).unwrap();
      } else {
        await dispatch(createClient(formData)).unwrap();
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save client:', err);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditMode ? 'Edit Client' : 'Add New Client'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || 'An error occurred. Please try again.'}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Required Fields */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>

          {/* Address Information */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Postal Code"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tax ID / VAT Number"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              disabled={isLoading}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isLoading}
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Update Client' : 'Add Client'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ClientForm; 