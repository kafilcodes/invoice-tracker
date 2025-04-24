import { useState, useEffect, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { login, register, reset } from '../redux/slices/authSlice';
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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

// Cursor-following gradient animation
const CursorGradientAnimation = memo(() => {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: -1,
        backgroundColor: '#000',
      }}
    >
      {/* Grid overlay for texture */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          zIndex: 1,
          opacity: 0.3
        }}
      />
      
      {/* Cursor following gradient */}
      <motion.div
        animate={{
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
          mass: 0.5
        }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.8) 0%, rgba(16, 185, 129, 0.6) 25%, rgba(236, 72, 153, 0.4) 50%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(100px)',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
    </div>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
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
            height: '90px', 
            width: 'auto',
            filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.8))',
            marginBottom: '12px'
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
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
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
              mb: 0.5,
              fontWeight: 500,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              fontFamily: '"Poppins", sans-serif',
              opacity: 0.9
            }}
          >
            {isLogin ? 'Sign in to your account to continue' : 'Create a new account to get started'}
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  );
});

// Create memoized text field components to prevent re-rendering
const StyledTextField = memo(({ name, label, value, onChange, type = 'text', error, helperText, InputProps, Icon }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      type={type}
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={helperText}
      margin="normal"
      InputProps={{
        ...InputProps,
        startAdornment: (
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

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.auth
  );
  
  // Add this to prevent animations on every input change
  const animationCompletedRef = useRef(true);
  
  useEffect(() => {
    if (isError) {
      setErrors({ general: message });
    }

    if (isSuccess || user) {
      navigate('/dashboard');
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    animationCompletedRef.current = false;
  };

  const onLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // Clear the specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const onRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    
    // Clear the specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateLoginForm = () => {
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
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    
    if (!registerData.name) {
      newErrors.name = 'Name is required';
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
  };

  const onLoginSubmit = (e) => {
    e.preventDefault();
    
    if (validateLoginForm()) {
      const userData = {
        email: loginData.email,
        password: loginData.password,
      };
      dispatch(login(userData));
    }
  };

  const onRegisterSubmit = (e) => {
    e.preventDefault();
    
    if (validateRegisterForm()) {
      const userData = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
      };
      dispatch(register(userData));
    }
  };

  // Create memoized form components
  const LoginForm = memo(() => {
    useEffect(() => {
      const timer = setTimeout(() => {
        animationCompletedRef.current = true;
      }, 500);
      
      return () => {
        clearTimeout(timer);
        animationCompletedRef.current = false;
      };
    }, []);
    
    // Password toggle icon component
    const PasswordAdornment = (
      <InputAdornment position="end">
        <IconButton
          aria-label="toggle password visibility"
          onClick={toggleShowPassword}
          edge="end"
          size="small"
          sx={{ padding: '6px' }}
        >
          {showPassword ? 
            <VisibilityOffIcon sx={{ fontSize: '18px' }} /> : 
            <VisibilityIcon sx={{ fontSize: '18px' }} />
          }
        </IconButton>
      </InputAdornment>
    );
    
    return (
      <motion.form 
        onSubmit={onLoginSubmit}
        animate={animationCompletedRef.current ? {} : "visible"}
        initial={animationCompletedRef.current ? {} : "hidden"}
        exit="exit"
        variants={fadeIn}
        key="login-form"
        style={{ overflow: 'hidden' }}
      >
        <motion.div 
          variants={slideUp}
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
        >
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

        <StyledTextField
          name="email"
          label="Email Address"
          value={loginData.email}
          onChange={onLoginChange}
          error={errors.email}
          helperText={errors.email}
          Icon={EmailIcon}
        />

        <StyledTextField
          name="password"
          label="Password"
          value={loginData.password}
          onChange={onLoginChange}
          error={errors.password}
          helperText={errors.password}
          type={showPassword ? 'text' : 'password'}
          Icon={LockIcon}
          InputProps={{
            endAdornment: PasswordAdornment
          }}
        />

        <motion.div 
          variants={slideUp}
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            marginTop: '4px'
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
                size="small"
                sx={{
                  '& .MuiSvgIcon-root': { fontSize: 20 }
                }}
              />
            }
            label={
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem', fontFamily: '"Poppins", sans-serif' }}
              >
                Remember me
              </Typography>
            }
          />
          <Typography 
            variant="body2" 
            component={RouterLink} 
            to="/forgot-password"
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              fontFamily: '"Poppins", sans-serif',
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
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
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
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
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
              onClick={toggleAuthMode}
            >
              Sign Up
            </Typography>
          </Typography>
        </motion.div>
      </motion.form>
    );
  });

  const RegisterForm = memo(() => {
    useEffect(() => {
      const timer = setTimeout(() => {
        animationCompletedRef.current = true;
      }, 500);
      
      return () => {
        clearTimeout(timer);
        animationCompletedRef.current = false;
      };
    }, []);
    
    // Password toggle components
    const PasswordAdornment = (
      <InputAdornment position="end">
        <IconButton
          aria-label="toggle password visibility"
          onClick={toggleShowPassword}
          edge="end"
          size="small"
          sx={{ padding: '6px' }}
        >
          {showPassword ? 
            <VisibilityOffIcon sx={{ fontSize: '18px' }} /> : 
            <VisibilityIcon sx={{ fontSize: '18px' }} />
          }
        </IconButton>
      </InputAdornment>
    );
    
    const ConfirmPasswordAdornment = (
      <InputAdornment position="end">
        <IconButton
          aria-label="toggle confirm password visibility"
          onClick={toggleShowConfirmPassword}
          edge="end"
          size="small"
          sx={{ padding: '6px' }}
        >
          {showConfirmPassword ? 
            <VisibilityOffIcon sx={{ fontSize: '18px' }} /> : 
            <VisibilityIcon sx={{ fontSize: '18px' }} />
          }
        </IconButton>
      </InputAdornment>
    );
    
    return (
      <motion.form 
        onSubmit={onRegisterSubmit}
        animate={animationCompletedRef.current ? {} : "visible"}
        initial={animationCompletedRef.current ? {} : "hidden"}
        exit="exit"
        variants={fadeIn}
        key="register-form"
        style={{ overflow: 'hidden' }}
      >
        <motion.div 
          variants={slideUp}
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
        >
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

        <StyledTextField
          name="name"
          label="Full Name"
          value={registerData.name}
          onChange={onRegisterChange}
          error={errors.name}
          helperText={errors.name}
          Icon={PersonIcon}
        />

        <StyledTextField
          name="email"
          label="Email Address"
          value={registerData.email}
          onChange={onRegisterChange}
          error={errors.email}
          helperText={errors.email}
          Icon={EmailIcon}
        />

        <StyledTextField
          name="password"
          label="Password"
          value={registerData.password}
          onChange={onRegisterChange}
          error={errors.password}
          helperText={errors.password}
          type={showPassword ? 'text' : 'password'}
          Icon={LockIcon}
          InputProps={{
            endAdornment: PasswordAdornment
          }}
        />

        <StyledTextField
          name="password2"
          label="Confirm Password"
          value={registerData.password2}
          onChange={onRegisterChange}
          error={errors.password2}
          helperText={errors.password2}
          type={showConfirmPassword ? 'text' : 'password'}
          Icon={CheckCircleIcon}
          InputProps={{
            endAdornment: ConfirmPasswordAdornment
          }}
        />

        <motion.div 
          variants={slideUp}
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
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
              <HowToRegIcon sx={{ fontSize: '20px' }} />
            }
            sx={{
              py: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              background: 'linear-gradient(90deg, #10B981, #0EA5E9)',
              boxShadow: '0 10px 25px -3px rgba(16, 185, 129, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              letterSpacing: '0.5px',
              fontFamily: '"Poppins", sans-serif',
              '&:hover': {
                background: 'linear-gradient(90deg, #059669, #0284C7)',
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </motion.div>

        <motion.div 
          variants={slideUp}
          animate={animationCompletedRef.current ? {} : "visible"}
          initial={animationCompletedRef.current ? {} : "hidden"}
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
              onClick={toggleAuthMode}
            >
              Sign In
            </Typography>
          </Typography>
        </motion.div>
      </motion.form>
    );
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <CursorGradientAnimation />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Logo isLogin={isLogin} />
        
        <Box
          sx={{
            backgroundColor: 'rgba(17, 17, 17, 0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius: 2,
            padding: { xs: 2, sm: 3 },
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
          }}
        >
          <AnimatePresence mode="wait">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </AnimatePresence>
        </Box>
        
        <Box 
          sx={{ 
            textAlign: 'center', 
            mt: 2, 
            opacity: 0.8,
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontFamily: '"Poppins", sans-serif' }}>
            © {new Date().getFullYear()} Invoice Tracker • All rights reserved
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem', fontFamily: '"Poppins", sans-serif' }}>
            Created by{' '}
            <Link
              href="https://github.com/kafilcodes"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: theme.palette.primary.main,
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Kafil
            </Link>
            {' '}with 💖
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Auth; 