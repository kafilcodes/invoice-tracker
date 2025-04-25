import { createTheme } from '@mui/material/styles';

// Common theme settings
const commonSettings = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
    },
    button: {
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    status: {
      pending: '#ff9800',
      approved: '#4caf50',
      rejected: '#f44336',
      paid: '#2196f3',
    },
  },
  ...commonSettings,
});

// Dark theme - AMOLED Black
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7b89f4', // Brighter, more vibrant primary
      light: '#a4b0ff',
      dark: '#4f5bac',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff4f9a',
      light: '#ff8cc7',
      dark: '#d81b7a',
      contrastText: '#fff',
    },
    background: {
      default: '#000000', // AMOLED black
      paper: '#0a0a0a',   // Nearly black
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc', // Brighter secondary text for better contrast
    },
    status: {
      pending: '#ffa726',
      approved: '#66bb6a',
      rejected: '#ef5350',
      paid: '#42a5f5',
    },
    divider: 'rgba(255, 255, 255, 0.1)', // More visible divider
  },
  ...commonSettings,
}); 