import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  useTheme,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

// Slide transition for the dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Reusable confirmation dialog component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed without action
 * @param {Function} props.onConfirm - Function to call when action is confirmed
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.confirmText - Text for the confirm button
 * @param {string} props.cancelText - Text for the cancel button
 * @param {string} props.type - Dialog type: 'info', 'warning', 'error', 'success'
 * @param {boolean} props.loading - Whether the confirm action is loading
 */
const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  const theme = useTheme();

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon fontSize="large" color="success" />;
      case 'error':
        return <ErrorIcon fontSize="large" color="error" />;
      case 'info':
        return <InfoIcon fontSize="large" color="info" />;
      case 'warning':
        return <WarningIcon fontSize="large" color="warning" />;
      default:
        return <WarningIcon fontSize="large" color="warning" />;
    }
  };

  // Get button color based on type
  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'info':
        return 'primary';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10],
          pt: 2,
          pb: 2
        }
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getIcon()}
            <Typography variant="h6" component="div" sx={{ ml: 1, fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 2 }}>
        <DialogContentText>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          sx={{ 
            borderRadius: 1.5,
            px: 2,
            fontWeight: 500,
            textTransform: 'none'
          }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={getButtonColor()}
          variant="contained"
          disableElevation
          sx={{ 
            borderRadius: 1.5,
            px: 2,
            fontWeight: 500,
            textTransform: 'none'
          }}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog; 