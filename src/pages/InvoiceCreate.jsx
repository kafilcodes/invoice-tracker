import { Box, Typography, Paper, Breadcrumbs } from '@mui/material';
import { Link } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';

const InvoiceCreate = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Invoice
        </Typography>
        <Breadcrumbs aria-label="breadcrumb">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Dashboard
          </Link>
          <Link to="/invoices" style={{ textDecoration: 'none', color: 'inherit' }}>
            Invoices
          </Link>
          <Typography color="text.primary">Create New</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <InvoiceForm />
      </Paper>
    </Box>
  );
};

export default InvoiceCreate; 