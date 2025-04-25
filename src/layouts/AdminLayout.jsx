import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useSelector } from 'react-redux';

// Components
import NavBar from '../components/NavBar';

const AdminLayout = () => {
  const { darkMode } = useSelector((state) => state.ui);
  
  return (
    <Box 
      sx={{ 
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <CssBaseline />
      
      {/* Navigation */}
      <NavBar admin={true} />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: '100%',
          '& img': {
            maxWidth: '100%',
            height: 'auto'
          },
          '& .watermark-logo': {
            maxWidth: '150px',
            opacity: 0.1
          },
          // Gradient background in dark mode
          backgroundImage: darkMode ? 
            'radial-gradient(circle at 10% 10%, rgba(20, 20, 50, 0.2) 0%, rgba(0, 0, 0, 0) 70%)' : 
            'none',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 