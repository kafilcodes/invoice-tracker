import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, Alert, CircularProgress, Divider } from '@mui/material';
import { runFullMigration } from '../scripts/migrateToRealtime';

const Cleanup = () => {
  const [loading, setLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);
  const [error, setError] = useState(null);

  const handleMigration = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await runFullMigration();
      setMigrationResults(results);
    } catch (err) {
      console.error('Migration error:', err);
      setError(err.message || 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Database Maintenance
        </Typography>
        <Typography variant="body1" paragraph>
          This page provides utilities for database maintenance and migration tasks.
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Firestore to Realtime Database Migration
          </Typography>
          <Typography variant="body2" paragraph>
            This tool will migrate all data from Firestore to the Realtime Database.
            This process cannot be undone and may take several minutes depending on the amount of data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleMigration}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Start Migration'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {migrationResults && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Migration Results:</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries(migrationResults).map(([entity, { success, failed }]) => (
                <Grid item xs={12} sm={6} md={3} key={entity}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1">{entity}</Typography>
                    <Typography color="success.main">Successful: {success}</Typography>
                    <Typography color="error.main">Failed: {failed}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Cleanup; 