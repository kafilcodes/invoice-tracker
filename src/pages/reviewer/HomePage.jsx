import React, { memo, useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, Box, Avatar, Typography, Chip, TextField, InputAdornment } from '@mui/material';
import { Grid, Container, Paper, IconButton } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Header } from '../../components/Header';
import { Toast } from '../../components/Toast';
import LoadingBackdrop from '../../components/LoadingBackdrop';

const OrganizationCard = memo(({ organization, onClick }) => {
  const theme = useTheme();
  const { name, address, photoURL } = organization;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card 
        onClick={() => onClick(organization)} 
        sx={{
          height: '68px',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          px: 1.5,
          py: 1,
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(45, 55, 72, 0.4)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.05)',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(55, 65, 81, 0.5)' 
              : 'rgba(255, 255, 255, 0.95)',
          },
        }}
      >
        {photoURL ? (
          <Avatar 
            src={photoURL} 
            alt={name}
            sx={{ 
              width: 40, 
              height: 40,
              border: '2px solid',
              borderColor: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }} 
          />
        ) : (
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
        )}
        
        <Box sx={{ ml: 1.5, flexGrow: 1, overflow: 'hidden' }}>
          <Typography 
            variant="subtitle1" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              lineHeight: 1.2,
              color: theme.palette.mode === 'dark' ? '#fff' : '#111',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {name}
          </Typography>
          {address && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <LocationOnIcon sx={{ fontSize: 12, mr: 0.5 }} />
              {address}
            </Typography>
          )}
        </Box>
        
        <IconButton 
          size="small" 
          color="primary"
          sx={{ 
            width: 28, 
            height: 28, 
            ml: 1,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.08)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(59, 130, 246, 0.2)' 
                : 'rgba(59, 130, 246, 0.15)',
            }
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Card>
    </motion.div>
  );
});

const HomePage = () => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredOrganizations, setFilteredOrganizations] = React.useState([]);
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const sampleOrgs = [
      { id: 1, name: 'Acme Corporation', address: '123 Main St, City' },
      { id: 2, name: 'Globex Industries', address: '456 Park Ave, Town' },
      { id: 3, name: 'Stark Enterprises', address: '789 Tower Rd, Metro' },
    ];
    setFilteredOrganizations(sampleOrgs);
  }, []);

  const handleSelectOrganization = (organization) => {
    setToast({
      open: true,
      message: `Selected ${organization.name}`,
      severity: 'success'
    });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LoadingBackdrop open={loading} />
      <Header />
      
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
        <Box 
          sx={{ 
            mb: 4, 
            textAlign: 'center',
            mx: 'auto',
            px: 2 
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2.2rem' },
                mb: 1.5,
                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome to Reviewer Portal
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="textSecondary"
              sx={{ 
                mb: 3, 
                maxWidth: 500,
                mx: 'auto',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                opacity: 0.85
              }}
            >
              Select an organization to review and manage invoices
            </Typography>
          </motion.div>
          
          <Paper 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            elevation={0}
            sx={{ 
              px: 2, 
              py: 0.5, 
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: theme => theme.palette.mode === 'dark' 
                ? 'rgba(30, 41, 59, 0.7)' 
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              border: '1px solid',
              borderColor: theme => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', ml: 1 }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 1.5,
                  py: 1,
                  fontSize: '0.95rem',
                }
              }}
              sx={{ mb: 0 }}
            />
          </Paper>
        </Box>

        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          {filteredOrganizations.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', marginTop: '3rem' }}
            >
              <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.6, mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No organizations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? "Try adjusting your search criteria" 
                  : "No organizations are available for you to review"}
              </Typography>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.5,
                    mx: 'auto',
                    maxWidth: 500,
                  }}
                >
                  {filteredOrganizations.map((org) => (
                    <motion.div key={org.id} variants={itemVariants}>
                      <OrganizationCard
                        organization={org}
                        onClick={handleSelectOrganization}
                      />
                    </motion.div>
                  ))}
                </Box>
              </AnimatePresence>
            </motion.div>
          )}
        </Box>
      </Container>
      
      <Toast
        open={toast.open}
        onClose={handleCloseToast}
        message={toast.message}
        severity={toast.severity}
        autoHideDuration={6000}
      />
    </Box>
  );
};

export default HomePage; 