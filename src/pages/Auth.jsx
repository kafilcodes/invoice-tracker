import { useState, useEffect, useRef, memo, useCallback, useMemo, forwardRef } from 'react';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login, register, reset, resetPassword } from '../redux/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  useTheme,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Link,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Toast from '../components/common/Toast';
import { debounce } from 'lodash';
import realtimeDb from '../firebase/realtimeDb';
import OrganizationSelector from '../components/auth/OrganizationSelector';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4 }
  }
};

const slideUp = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: {
    y: -30,
    opacity: 0,
    transition: { duration: 0.4 }
  }
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Create a forwardRef enhanced TextField that doesn't re-render unnecessarily
const FormTextField = forwardRef(({ name, label, value, onChange, type = 'text', error, helperText, Icon, endAdornment }, ref) => {
  // Use a constant function reference to prevent re-renders
  const handleChange = useCallback((e) => {
    onChange(e.target.name, e.target.value);
  }, [onChange]);

  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextField
      fullWidth
      variant="outlined"
      type={type}
      name={name}
      label={label}
      value={value}
      onChange={handleChange}
      error={!!error}
      helperText={helperText}
      margin="normal"
      inputRef={ref}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      InputProps={{
        startAdornment: Icon && (
          <InputAdornment position="start">
            <Icon 
              sx={{ 
                color: error 
                  ? 'error.main' 
                  : value 
                    ? 'primary.main' 
                    : 'text.secondary',
                fontSize: '22px',
                mr: 0.5
              }} 
            />
          </InputAdornment>
        ),
        endAdornment: endAdornment && React.cloneElement(endAdornment, { isFocused }),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          fontSize: '0.95rem',
          padding: '2px',
          height: '50px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }
        },
        '& .MuiInputBase-input': {
          color: '#fff',
          fontWeight: 600,
          fontFamily: '"Poppins", sans-serif',
        },
        '& .MuiInputLabel-root': {
          fontSize: '0.95rem',
          fontFamily: '"Poppins", sans-serif',
          transform: 'translate(14px, 16px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -6px) scale(0.75)',
          }
        },
        '& .MuiFormHelperText-root': {
          fontSize: '0.8rem',
          marginLeft: 1,
          marginTop: 0.5
        },
        mb: 1.5
      }}
    />
  );
});

FormTextField.displayName = 'FormTextField';

// Create a password visibility icon component
const PasswordVisibilityToggle = ({ showPassword, togglePassword, isFocused }) => {
  // Prevent losing focus when clicking the password toggle
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePassword();
  };

  return (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        onClick={handleToggle}
        onMouseDown={(e) => e.preventDefault()}
        edge="end"
        size="small"
        sx={{ padding: '6px' }}
      >
        {showPassword ? (
          <VisibilityOffIcon 
            sx={{ 
              fontSize: '18px', 
              color: isFocused ? '#fff' : 'rgba(0, 0, 0, 0.6)'
            }} 
          />
        ) : (
          <VisibilityIcon 
            sx={{ 
              fontSize: '18px', 
              color: isFocused ? '#fff' : 'rgba(0, 0, 0, 0.6)'
            }} 
          />
        )}
      </IconButton>
    </InputAdornment>
  );
};

// Create a stable login form component
const LoginForm = memo(({ formData, onInputChange, onSubmit, errors, isLoading, toggleMode, togglePassword, showPassword, onForgotPassword }) => {
  // Create stable refs for inputs to maintain focus
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const passwordAdornment = useMemo(() => (
    <PasswordVisibilityToggle
      showPassword={showPassword}
      togglePassword={togglePassword}
    />
  ), [showPassword, togglePassword]);

  return (
    <motion.form
      onSubmit={onSubmit}
      animate="visible"
      initial="hidden"
      exit="exit"
      variants={fadeIn}
      key="login-form"
      style={{ overflow: 'hidden' }}
    >
      <motion.div variants={slideUp}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.8rem' },
            background: 'linear-gradient(90deg, #4F46E5, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(79, 70, 229, 0.3)',
            fontFamily: '"Poppins", sans-serif'
          }}
        >
          Welcome Back
        </Typography>
      </motion.div>

      {errors.general && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              fontSize: '0.9rem',
              py: 0.5,
              '& .MuiAlert-icon': { fontSize: '20px' } 
            }}
          >
            {errors.general}
          </Alert>
        </motion.div>
      )}

      <FormTextField
        ref={emailInputRef}
        name="email"
        label="Email Address"
        value={formData.email}
        onChange={onInputChange}
        error={errors.email}
        helperText={errors.email}
        Icon={EmailIcon}
      />

      <FormTextField
        ref={passwordInputRef}
        name="password"
        label="Password"
        value={formData.password}
        onChange={onInputChange}
        error={errors.password}
        helperText={errors.password}
        type={showPassword ? 'text' : 'password'}
        Icon={LockIcon}
        endAdornment={passwordAdornment}
      />

      <motion.div 
        variants={slideUp}
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography 
          variant="body2" 
          onClick={onForgotPassword}
          sx={{ 
            color: 'primary.main',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            fontFamily: '"Poppins", sans-serif',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Forgot password?
        </Typography>
      </motion.div>

      <motion.div 
        variants={slideUp}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? 
            <CircularProgress size={20} color="inherit" /> : 
            <LoginIcon sx={{ fontSize: '20px' }} />
          }
          sx={{
            py: 1.5,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            background: 'linear-gradient(90deg, #4F46E5, #8B5CF6)',
            boxShadow: '0 10px 25px -3px rgba(79, 70, 229, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '0.5px',
            fontFamily: '"Poppins", sans-serif',
            '&:hover': {
              background: 'linear-gradient(90deg, #4338CA, #7C3AED)',
              boxShadow: '0 15px 30px -5px rgba(79, 70, 229, 0.5)',
              transform: 'translateY(-2px)',
            },
            '&:after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-out',
            },
            '&:hover:after': {
              transform: 'translateY(0)',
            },
            mb: 2
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </motion.div>

      <motion.div 
        variants={slideUp}
        style={{ textAlign: 'center' }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: '0.85rem', fontFamily: '"Poppins", sans-serif' }}
        >
          Don't have an account?{' '}
          <Typography
            component="span"
            variant="body2"
            color="primary"
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              fontFamily: '"Poppins", sans-serif',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={toggleMode}
          >
            Sign Up
          </Typography>
        </Typography>
      </motion.div>
    </motion.form>
  );
});

// Create a stable register form component
const RegisterForm = memo(({ 
  formData, 
  onInputChange, 
  onSubmit, 
  errors, 
  isLoading, 
  toggleMode, 
  togglePassword, 
  showPassword, 
  toggleConfirmPassword, 
  showConfirmPassword,
  checkOrgExists,
  isOrgSelector,
  setIsOrgSelector 
}) => {
  // Create stable refs for inputs to maintain focus
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const roleSelectRef = useRef(null);

  // Auto-focus on role select when form mounts
  useEffect(() => {
    // Use setTimeout to ensure the component is fully mounted
    const timer = setTimeout(() => {
      if (roleSelectRef.current) {
        // Focus on the role select
        const selectElement = roleSelectRef.current.querySelector('div[role="button"]');
        if (selectElement) {
          selectElement.focus();
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const passwordAdornment = useMemo(() => (
    <PasswordVisibilityToggle
      showPassword={showPassword}
      togglePassword={togglePassword}
    />
  ), [showPassword, togglePassword]);

  const confirmPasswordAdornment = useMemo(() => (
    <PasswordVisibilityToggle
      showPassword={showConfirmPassword}
      togglePassword={toggleConfirmPassword}
    />
  ), [showConfirmPassword, toggleConfirmPassword]);

  // Show organization selector for reviewers
  const showOrgSelector = formData.role === 'reviewer' && isOrgSelector;
  
  // Check if role is selected to show the rest of the form
  const isRoleSelected = !!formData.role;

  return (
    <motion.form 
      onSubmit={onSubmit}
      animate="visible"
      initial="hidden"
      exit="exit"
      variants={fadeIn}
      key="register-form"
      style={{ overflow: 'hidden' }}
    >
      <motion.div variants={slideUp}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.8rem' },
            background: 'linear-gradient(90deg, #10B981, #0EA5E9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
            fontFamily: '"Poppins", sans-serif'
          }}
        >
          Create Account
        </Typography>
      </motion.div>

      {errors.general && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              fontSize: '0.9rem',
              py: 0.5,
              '& .MuiAlert-icon': { fontSize: '20px' } 
            }}
          >
            {errors.general}
          </Alert>
        </motion.div>
      )}

      <motion.div
        variants={slideUp}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography
          variant="subtitle1"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            mb: 2,
            fontFamily: '"Poppins", sans-serif'
          }}
        >
          Please select your role to continue
        </Typography>
      </motion.div>

      <FormControl 
        fullWidth 
        margin="normal" 
        sx={{ mb: 3 }}
        error={!!errors.role}
        ref={roleSelectRef}
      >
        <InputLabel id="role-select-label">Choose Role *</InputLabel>
        <Select
          labelId="role-select-label"
          id="role-select"
          name="role"
          value={formData.role || ''}
          onChange={(e) => {
            onInputChange('role', e.target.value);
            // Clear organization when role changes
            if (e.target.value === 'reviewer') {
              setIsOrgSelector(true);
            } else {
              setIsOrgSelector(false);
            }
          }}
          label="Choose Role *"
          startAdornment={
            <InputAdornment position="start">
              <AdminPanelSettingsIcon 
                sx={{ 
                  color: errors.role 
                    ? 'error.main' 
                    : formData.role 
                      ? 'primary.main' 
                      : 'text.secondary',
                }}
              />
            </InputAdornment>
          }
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              height: '50px',
              borderWidth: errors.role ? 2 : 1,
              borderColor: errors.role 
                ? 'error.main' 
                : formData.role 
                  ? 'primary.main' 
                  : 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: errors.role 
                  ? 'error.main' 
                  : 'primary.main',
              }
            }
          }}
        >
          <MenuItem value="">Select a role</MenuItem>
          <MenuItem value="reviewer">Reviewer</MenuItem>
          <MenuItem value="admin">Administrator</MenuItem>
        </Select>
        {errors.role && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
            {errors.role}
          </Typography>
        )}
        {!isRoleSelected && !errors.role && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 2 }}>
            You must select a role before continuing
          </Typography>
        )}
      </FormControl>

      {/* Only show the rest of the form if a role is selected */}
      {isRoleSelected && (
        <motion.div
          variants={slideUp}
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: 1, 
            height: 'auto',
            transition: { 
              type: 'spring',
              stiffness: 300,
              damping: 24,
              duration: 0.4
            }
          }}
        >
          <FormTextField
            ref={nameInputRef}
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={onInputChange}
            error={errors.name}
            helperText={errors.name}
            Icon={PersonIcon}
          />

          {showOrgSelector ? (
            <OrganizationSelector 
              value={formData.organization} 
              onChange={(value) => onInputChange('organization', value)} 
            />
          ) : (
            <FormTextField
              name="organization"
              label={formData.role === 'admin' ? "Create your organization, enter name" : "Organization Name"}
              value={formData.organization}
              onChange={(name, value) => {
                onInputChange(name, value);
                if (formData.role === 'admin') {
                  checkOrgExists(value);
                }
              }}
              error={errors.organization}
              helperText={formData.role === 'admin' 
                ? errors.organization || "This will be your new organization's name" 
                : "Employees of your organization must use same name (no typos) to register as reviewer"}
              Icon={BusinessIcon}
            />
          )}

          <FormTextField
            ref={emailInputRef}
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={onInputChange}
            error={errors.email}
            helperText={errors.email}
            Icon={EmailIcon}
          />

          <FormTextField
            ref={passwordInputRef}
            name="password"
            label="Password"
            value={formData.password}
            onChange={onInputChange}
            error={errors.password}
            helperText={errors.password}
            type={showPassword ? 'text' : 'password'}
            Icon={LockIcon}
            endAdornment={passwordAdornment}
          />

          <FormTextField
            ref={confirmPasswordInputRef}
            name="password2"
            label="Confirm Password"
            value={formData.password2}
            onChange={onInputChange}
            error={errors.password2}
            helperText={errors.password2}
            type={showConfirmPassword ? 'text' : 'password'}
            Icon={CheckCircleIcon}
            endAdornment={confirmPasswordAdornment}
          />
        </motion.div>
      )}

      <motion.div 
        variants={slideUp}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ marginTop: isRoleSelected ? '8px' : '12px' }}
      >
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? 
            <CircularProgress size={20} color="inherit" /> : 
            isRoleSelected ? <HowToRegIcon sx={{ fontSize: '20px' }} /> : <AdminPanelSettingsIcon sx={{ fontSize: '20px' }} />
          }
          sx={{
            py: 1.5,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            background: isRoleSelected 
              ? 'linear-gradient(90deg, #10B981, #0EA5E9)' 
              : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            boxShadow: '0 10px 25px -3px rgba(16, 185, 129, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '0.5px',
            fontFamily: '"Poppins", sans-serif',
            '&:hover': {
              background: isRoleSelected
                ? 'linear-gradient(90deg, #059669, #0284C7)'
                : 'linear-gradient(90deg, #4F46E5, #7C3AED)',
              boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.5)',
              transform: 'translateY(-2px)',
            },
            '&:after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-out',
            },
            '&:hover:after': {
              transform: 'translateY(0)',
            },
            mb: 2
          }}
        >
          {isLoading 
            ? 'Creating Account...' 
            : isRoleSelected 
              ? 'Create Account' 
              : 'Select Role to Continue'
          }
        </Button>
      </motion.div>

      <motion.div 
        variants={slideUp}
        style={{ textAlign: 'center' }}
      >
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontSize: '0.85rem', fontFamily: '"Poppins", sans-serif' }}
        >
          Already have an account?{' '}
          <Typography
            component="span"
            variant="body2"
            color="primary"
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              fontFamily: '"Poppins", sans-serif',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
            onClick={toggleMode}
          >
            Sign In
          </Typography>
        </Typography>
      </motion.div>
    </motion.form>
  );
});

// Logo component with hover effect
const Logo = memo(({ isLogin }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.img 
          src="/bill.png" 
          alt="Invoice Tracker Logo"
          initial={{ rotateZ: -5 }}
          animate={{ rotateZ: 5 }}
          transition={{ 
            repeat: Infinity,
            repeatType: "reverse",
            duration: 2
          }}
          style={{ 
            height: '140px', 
            width: 'auto',
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))',
            marginBottom: '16px'
          }} 
        />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            align="center"
            sx={{ 
              mb: 1, 
              fontWeight: 800,
              fontSize: { xs: '2.2rem', sm: '2.6rem' },
              letterSpacing: '-0.025em',
              background: 'linear-gradient(90deg, #4F46E5, #EC4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(79, 70, 229, 0.4)',
              fontFamily: '"Poppins", sans-serif'
            }}
          >
            Invoice Tracker
          </Typography>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography 
            variant="body1" 
            color="text.secondary" 
            align="center"
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontFamily: '"Poppins", sans-serif',
              opacity: 0.9,
              maxWidth: '320px'
            }}
          >
            {isLogin ? 'Sign in to your account to continue' : 'Create a new account to get started'}
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
});

// Add a new ForgotPasswordForm component
const ForgotPasswordForm = memo(({ onSubmit, onBack, email, setEmail, isLoading, message, messageType }) => {
  // Create stable ref for input to maintain focus
  const emailInputRef = useRef(null);

  return (
    <motion.form 
      onSubmit={onSubmit}
      animate="visible"
      initial="hidden"
      exit="exit"
      variants={fadeIn}
      key="forgot-password-form"
      style={{ overflow: 'hidden' }}
    >
      <motion.div variants={slideUp}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.8rem' },
            background: 'linear-gradient(90deg, #4F46E5, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(79, 70, 229, 0.3)',
            fontFamily: '"Poppins", sans-serif'
          }}
        >
          Reset Password
        </Typography>
      </motion.div>

      <motion.div variants={slideUp}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 3, textAlign: 'center', fontFamily: '"Poppins", sans-serif' }}
        >
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
      </motion.div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert 
            severity={messageType || "info"}
            sx={{ 
              mb: 2, 
              fontSize: '0.9rem',
              py: 0.5,
              '& .MuiAlert-icon': { fontSize: '20px' } 
            }}
          >
            {message}
          </Alert>
        </motion.div>
      )}

      <FormTextField
        ref={emailInputRef}
        name="email"
        label="Email Address"
        value={email}
        onChange={(name, value) => setEmail(value)}
        Icon={EmailIcon}
      />

      <motion.div 
        variants={slideUp}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ marginTop: '8px' }}
      >
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? 
            <CircularProgress size={20} color="inherit" /> : 
            <EmailIcon sx={{ fontSize: '20px' }} />
          }
          sx={{
            py: 1.5,
            borderRadius: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            background: 'linear-gradient(90deg, #4F46E5, #8B5CF6)',
            boxShadow: '0 10px 25px -3px rgba(79, 70, 229, 0.4)',
            position: 'relative',
            overflow: 'hidden',
            letterSpacing: '0.5px',
            fontFamily: '"Poppins", sans-serif',
            '&:hover': {
              background: 'linear-gradient(90deg, #4338CA, #7C3AED)',
              boxShadow: '0 15px 30px -5px rgba(79, 70, 229, 0.5)',
              transform: 'translateY(-2px)',
            },
            '&:after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
              transform: 'translateY(-100%)',
              transition: 'transform 0.3s ease-out',
            },
            '&:hover:after': {
              transform: 'translateY(0)',
            },
            mb: 2
          }}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </motion.div>

      <motion.div 
        variants={slideUp}
        style={{ textAlign: 'center' }}
      >
        <Typography
          component="span"
          variant="body2"
          color="primary"
          sx={{
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            fontFamily: '"Poppins", sans-serif',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
          onClick={onBack}
        >
          Back to Sign In
        </Typography>
      </motion.div>
    </motion.form>
  );
});

ForgotPasswordForm.displayName = 'ForgotPasswordForm';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    organization: '',
    role: '',
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetMessageType, setResetMessageType] = useState('info');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isOrgSelector, setIsOrgSelector] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: '',
    title: '',
    severity: 'info'
  });
  
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );
  
  useEffect(() => {
    if (isError) {
      console.error('Authentication error:', message);
      setErrors({ general: message });
      // Show toast notification for auth errors
      setToast({
        open: true,
        message: message || 'Authentication failed. Please try again.',
        title: 'Error',
        severity: 'error'
      });
    }

    if (isSuccess || user) {
      console.log('Authentication successful, redirecting to dashboard');
      setToast({
        open: true,
        message: 'Authentication successful!',
        title: 'Success',
        severity: 'success'
      });
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const toggleAuthMode = useCallback(() => {
    setIsLogin(prevState => !prevState);
    setErrors({});
    
    // Reset registration data when switching to registration form
    if (isLogin) {
      setRegisterData({
        name: '',
        email: '',
        password: '',
        password2: '',
        organization: '',
        role: '',
      });
      setIsOrgSelector(false);
    }
  }, [isLogin]);

  // Completely redesigned input change handler to avoid unnecessary re-renders
  const handleLoginInputChange = useCallback((name, value) => {
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for this field if needed
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleRegisterInputChange = useCallback((name, value) => {
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for this field if needed
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Debounced function to check if organization already exists
  const checkOrgExists = useCallback(
    debounce(async (orgName) => {
      if (!orgName || registerData.role !== 'admin') return;
      
      try {
        const result = await realtimeDb.getData(`organizations/${orgName}`);
        
        if (result.success && result.exists) {
          setErrors(prev => ({
            ...prev,
            organization: 'This organization name is already taken'
          }));
          
          setToast({
            open: true,
            message: `Organization "${orgName}" already exists. Please choose a different name.`,
            title: 'Organization Exists',
            severity: 'warning'
          });
        }
      } catch (err) {
        console.error('Error checking organization existence:', err);
      }
    }, 500),
    [registerData.role]
  );

  const validateLoginForm = useCallback(() => {
    const newErrors = {};
    
    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [loginData]);

  const validateRegisterForm = useCallback(() => {
    const newErrors = {};
    
    // First check if role is selected, and prioritize this error
    if (!registerData.role) {
      newErrors.role = 'Please select a role to continue';
      // If role is missing, return immediately with only this error
      setErrors(newErrors);
      
      setToast({
        open: true,
        message: 'Please select your role before continuing',
        title: 'Role Required',
        severity: 'warning'
      });
      
      return false;
    }
    
    if (!registerData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!registerData.organization) {
      newErrors.organization = 'Organization name is required';
    }

    // Check if reviewer has selected a valid organization
    if (registerData.role === 'reviewer' && !registerData.organization) {
      newErrors.organization = 'Please select your organization';
    }
    
    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (registerData.password !== registerData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [registerData, setToast]);

  const onLoginSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (validateLoginForm()) {
      const userData = {
        email: loginData.email,
        password: loginData.password,
      };
      dispatch(login(userData));
    }
  }, [loginData, validateLoginForm, dispatch]);

  const onRegisterSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (validateRegisterForm()) {
      // For admin role, check if organization already exists
      if (registerData.role === 'admin') {
        const orgCheckResult = await realtimeDb.getData(`organizations/${registerData.organization}`);
        
        if (orgCheckResult.success && orgCheckResult.exists) {
          setErrors(prev => ({
            ...prev,
            organization: 'This organization name is already taken'
          }));
          
          setToast({
            open: true,
            message: `Organization "${registerData.organization}" already exists. Please choose a different name.`,
            title: 'Organization Exists',
            severity: 'warning'
          });
          
          return;
        }
      }
      
      // For reviewer role, check if organization exists
      if (registerData.role === 'reviewer') {
        const orgCheckResult = await realtimeDb.getData(`organizations/${registerData.organization}`);
        
        if (!orgCheckResult.success || !orgCheckResult.exists) {
          setErrors(prev => ({
            ...prev,
            organization: 'This organization does not exist'
          }));
          
          setToast({
            open: true,
            message: `Organization "${registerData.organization}" doesn't exist. Please check the name or contact your administrator.`,
            title: 'Organization Not Found',
            severity: 'error'
          });
          
          return;
        }
      }
      
      const userData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        organization: registerData.organization,
        role: registerData.role,
      };
      
      dispatch(register(userData));
    }
  }, [registerData, validateRegisterForm, dispatch]);

  const handleForgotPassword = useCallback(() => {
    setIsForgotPassword(true);
    setForgotPasswordEmail(loginData.email || '');
    setResetMessage('');
  }, [loginData.email]);

  const handleBackToLogin = useCallback(() => {
    setIsForgotPassword(false);
    setResetMessage('');
  }, []);

  const onForgotPasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setResetMessage('Please enter your email address');
      setResetMessageType('warning');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setResetMessage('Please enter a valid email address');
      setResetMessageType('error');
      return;
    }
    
    try {
      const result = await dispatch(resetPassword(forgotPasswordEmail)).unwrap();
      setResetMessage('Password reset email sent. Please check your inbox.');
      setResetMessageType('success');
      
      setToast({
        open: true,
        message: 'Password reset email sent. Please check your inbox.',
        title: 'Email Sent',
        severity: 'success'
      });
    } catch (error) {
      setResetMessage(error.message || 'Failed to send reset email. Please try again.');
      setResetMessageType('error');
      
      setToast({
        open: true,
        message: error.message || 'Failed to send reset email. Please try again.',
        title: 'Error',
        severity: 'error'
      });
    }
  }, [forgotPasswordEmail, dispatch]);

  // Handle toast close
  const handleCloseToast = () => {
    setToast(prev => ({
      ...prev,
      open: false
    }));
  };

  // Memoize the form components to prevent re-renders
  const loginFormComponent = useMemo(() => (
    <LoginForm
      formData={loginData}
      onInputChange={handleLoginInputChange}
      onSubmit={onLoginSubmit}
      errors={errors}
      isLoading={isLoading}
      toggleMode={toggleAuthMode}
      togglePassword={toggleShowPassword}
      showPassword={showPassword}
      onForgotPassword={handleForgotPassword}
    />
  ), [loginData, handleLoginInputChange, onLoginSubmit, errors, isLoading, toggleAuthMode, toggleShowPassword, showPassword, handleForgotPassword]);

  const registerFormComponent = useMemo(() => (
    <RegisterForm
      formData={registerData}
      onInputChange={handleRegisterInputChange}
      onSubmit={onRegisterSubmit}
      errors={errors}
      isLoading={isLoading}
      toggleMode={toggleAuthMode}
      togglePassword={toggleShowPassword}
      showPassword={showPassword}
      toggleConfirmPassword={toggleShowConfirmPassword}
      showConfirmPassword={showConfirmPassword}
      checkOrgExists={checkOrgExists}
      isOrgSelector={isOrgSelector}
      setIsOrgSelector={setIsOrgSelector}
    />
  ), [registerData, handleRegisterInputChange, onRegisterSubmit, errors, isLoading, toggleAuthMode, toggleShowPassword, showPassword, toggleShowConfirmPassword, showConfirmPassword, checkOrgExists, isOrgSelector]);

  // Add a new memoized forgotPasswordComponent
  const forgotPasswordComponent = useMemo(() => (
    <ForgotPasswordForm
      onSubmit={onForgotPasswordSubmit}
      onBack={handleBackToLogin}
      email={forgotPasswordEmail}
      setEmail={setForgotPasswordEmail}
      isLoading={isLoading}
      message={resetMessage}
      messageType={resetMessageType}
    />
  ), [forgotPasswordEmail, setForgotPasswordEmail, onForgotPasswordSubmit, handleBackToLogin, isLoading, resetMessage, resetMessageType]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #000000 0%, #0F172A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Content area */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 480, md: 1080 },
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 5 },
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'center', md: 'stretch' },
          justifyContent: 'center',
          gap: { xs: 4, md: 6 },
        }}
      >
        {/* Logo and app info - now in the left column for md screens and above */}
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: { xs: '100%', md: '45%' },
            maxWidth: { xs: '100%', md: 450 },
            order: { xs: 1, md: 1 },
            p: { xs: 1, md: 3 }
          }}
        >
          <Logo isLogin={!isForgotPassword && isLogin} />

          {/* Additional welcome info for desktop view */}
          <Box 
            sx={{ 
              mt: 6, 
              display: { xs: 'none', md: 'block' }, 
              textAlign: 'center',
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 3,
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              width: '100%'
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                fontWeight: 700,
                color: 'primary.main',
                background: 'linear-gradient(90deg, #4F46E5, #8B5CF6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Track invoices efficiently
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
              Streamline your billing workflow with our powerful invoice management system.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <AdminPanelSettingsIcon 
                  sx={{ color: 'primary.main', fontSize: 40, mb: 1.5 }} 
                />
                <Typography variant="body1" fontWeight={600}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Manage all invoices
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <PersonIcon 
                  sx={{ color: 'secondary.main', fontSize: 40, mb: 1.5 }} 
                />
                <Typography variant="body1" fontWeight={600}>
                  Reviewer Portal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Review and process
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Auth forms - now in the right column for md screens and above */}
        <Box
          sx={{
            width: { xs: '100%', md: '55%' },
            maxWidth: { xs: '100%', md: 520 },
            order: { xs: 2, md: 2 }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 3,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              p: { xs: 3, sm: 4 },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              {isForgotPassword ? (
                forgotPasswordComponent
              ) : isLogin ? (
                loginFormComponent
              ) : (
                registerFormComponent
              )}
            </AnimatePresence>
            
            {/* Connection issue helper link */}
            {errors.general && errors.general.includes('offline') && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography
                  component={RouterLink}
                  to="/firebase-diagnostic"
                  variant="body2"
                  color="primary"
                  sx={{
                    cursor: 'pointer',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Having trouble connecting? Click here to run diagnostics
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Background grid animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: theme.palette.mode === 'dark'
            ? 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          zIndex: 0,
          opacity: 0.2,
          animation: 'gridMove 50s linear infinite',
          '@keyframes gridMove': {
            '0%': {
              transform: 'translate(0, 0)'
            },
            '100%': {
              transform: 'translate(30px, 30px)'
            }
          }
        }}
      />
      
      {/* Toast notification for errors and success messages */}
      <Toast
        open={toast.open}
        onClose={handleCloseToast}
        message={toast.message}
        title={toast.title}
        severity={toast.severity}
      />
    </Box>
  );
};

export default Auth; 