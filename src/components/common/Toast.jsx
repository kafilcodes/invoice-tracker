import React, { forwardRef } from 'react';
import { Snackbar, Alert, AlertTitle, Slide } from '@mui/material';

const SlideTransition = (props) => {
  return <Slide {...props} direction="up" />;
};

/**
 * Toast notification component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the toast is open
 * @param {Function} props.onClose - Function to call when toast is closed
 * @param {string} props.message - Toast message
 * @param {string} props.title - Toast title (optional)
 * @param {string} props.severity - Toast severity: 'success', 'error', 'warning', 'info'
 * @param {number} props.autoHideDuration - Auto hide duration in milliseconds
 * @param {string} props.position - Toast position: 'top', 'bottom', 'left', 'right'
 */
const Toast = ({
  open,
  onClose,
  message,
  title,
  severity = 'success',
  autoHideDuration = 6000,
  position = { vertical: 'bottom', horizontal: 'right' }
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={SlideTransition}
      sx={{ 
        '& .MuiPaper-root': {
          boxShadow: '0 8px 20px 0 rgba(0,0,0,0.2)',
          borderRadius: 2,
          minWidth: 300,
          maxWidth: { xs: '90%', sm: 400 }
        }
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{ 
          width: '100%',
          '& .MuiAlert-icon': {
            fontSize: 28,
            opacity: 0.9,
            alignItems: 'center'
          }
        }}
      >
        {title && <AlertTitle sx={{ fontWeight: 'bold' }}>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast; 