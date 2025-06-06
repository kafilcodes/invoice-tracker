import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
  useTheme,
  Typography,
  IconButton,
  Chip,
  GlobalStyles,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  AdminPanelSettings as AdminPanelIcon,
  Assessment as AssessmentIcon,
  MenuOpen as MenuOpenIcon,
  GitHub as GitHubIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { logout } from '../redux/slices/authSlice';
import { toggleColorMode } from '../redux/slices/themeSlice';
import { getCurrentUser } from '../firebase/firebase';
import billLogo from '/bill.png';

const NavBar = ({ admin = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const mode = theme.palette.mode;
  const { user } = useSelector((state) => state.auth);
  const { data } = useSelector((state) => state.profile);
  
  const [open, setOpen] = useState(true); // Sidebar open by default
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [firebaseUser, setFirebaseUser] = useState(null);
  
  // Fetch current user data from Firebase directly
  useEffect(() => {
    const fetchFirebaseUser = async () => {
      if (!user?.uid) return;
      
      try {
        const result = await getCurrentUser();
        if (result.success && result.data) {
          console.log('Firebase user data fetched:', result.data);
          setFirebaseUser(result.data);
        }
      } catch (error) {
        console.error('Error fetching Firebase user:', error);
      }
    };
    
    fetchFirebaseUser();
  }, [user?.uid]);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleDrawerToggle = () => {
    setOpen(!open);
  };
  
  // More robustly determine user info from all sources with Firebase priority
  const displayName = firebaseUser?.displayName || user?.displayName || data?.name || 'User';
  // Ensure we're checking all possible sources for the profile photo
  const photoURL = firebaseUser?.photoURL || user?.photoURL || data?.profilePicture || '';
  // Capitalize role for display
  const userRole = ((firebaseUser?.role || user?.role || data?.role || 'reviewer')?.charAt(0).toUpperCase() + 
                   (firebaseUser?.role || user?.role || data?.role || 'reviewer')?.slice(1));
  // Ensure organization and department are properly captured from all sources - preserve original case
  const userOrganization = firebaseUser?.organization || user?.organization || data?.organization || '';
  const userDepartment = firebaseUser?.department || user?.department || data?.department || '';
  // Log what we found to help debugging
  console.log('NavBar profile info:', {
    displayName,
    photoURL,
    userRole,
    userOrganization,
    userDepartment,
    firebaseUserData: !!firebaseUser,
    userData: !!user,
    profileStateData: !!data
  });

  function handleLogout() {
    dispatch(logout());
    navigate('/login');
  }
  
  function handleItemClick(item) {
    if (item.onClick) {
      item.onClick();
    } else if (item.to) {
      navigate(item.to);
    } else if (item.path) {
      navigate(item.path);
    }
  }

  function handleThemeToggle() {
    dispatch(toggleColorMode());
  }
  
  const drawerWidth = open ? 250 : 70;
  
  // Animation variants
  const drawerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };
  
  const getGradientBorder = (index) => {
    const gradients = [
      'linear-gradient(45deg, #FF416C, #FF4B2B)',
      'linear-gradient(45deg, #4158D0, #C850C0)',
      'linear-gradient(45deg, #0093E9, #80D0C7)',
      'linear-gradient(45deg, #00C9FF, #92FE9D)',
      'linear-gradient(45deg, #F09819, #EDDE5D)',
      'linear-gradient(45deg, #46C2CB, #8FEBE6)',
    ];
    
    return {
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: -4,
        width: 4,
        height: '100%',
        background: gradients[index % gradients.length],
        borderRadius: '4px 0 0 4px',
        opacity: 0,
        transition: 'opacity 0.3s ease',
      },
      '&:hover::before': {
        opacity: 1,
      },
      '&.active::before': {
        opacity: 1,
      }
    };
  };
  
  // Get navigation items based on user role
  const getNavItems = () => {
    const regularItems = [
      {
        name: 'Dashboard',
        icon: <DashboardIcon />,
        to: '/',
      },
      {
        name: 'Profile',
        icon: <PersonIcon />,
        to: '/profile',
      },
      // Only show Create Invoice to non-reviewer roles
      {
        name: 'Create Invoice',
        icon: <AddIcon />,
        to: '/invoices/create',
        hide: (userRole.toLowerCase() === 'reviewer')
      },
      {
        name: 'Invoices',
        icon: <DescriptionIcon />,
        to: '/invoices',
      },
      {
        name: 'Activity Logs',
        icon: <AssessmentIcon />,
        to: '/activity-logs',
      },
      {
        name: 'Logout',
        icon: <LogoutIcon />,
        onClick: handleLogout,
      },
    ];

    // Admin items with admin-specific navigation
    const adminItems = [
      {
        name: 'Dashboard',
        icon: <DashboardIcon />,
        to: '/',
      },
      {
        name: 'Organization',
        icon: <BusinessIcon />,
        to: '/admin/organization',
      },
      {
        name: 'All Invoices',
        icon: <DescriptionIcon />,
        to: '/invoices',
      },
      {
        name: 'Create Invoice',
        icon: <AddIcon />,
        to: '/invoices/create',
      },
      {
        name: 'Activity Logs',
        icon: <AssessmentIcon />,
        to: '/activity-logs',
      },
      {
        name: 'Profile',
        icon: <PersonIcon />,
        to: '/profile',
      },
      {
        name: 'Logout',
        icon: <LogoutIcon />,
        onClick: handleLogout,
      },
    ];

    // Check if the user is an admin using all possible sources of truth
    const isAdmin = firebaseUser?.role === 'admin' || user?.role === 'admin' || userRole.toLowerCase() === 'admin';
    console.log('Navigation role check:', { 
      firebaseUserRole: firebaseUser?.role,
      storeUserRole: user?.role, 
      userRoleState: userRole,
      isAdmin
    });
    
    return isAdmin ? adminItems : regularItems;
  };

  // Generate nav items based on user role
  const navItems = useMemo(() => {
    try {
      return getNavItems() || [];
    } catch (error) {
      console.error('Error generating navigation items:', error);
      return [];
    }
  }, [user, userRole, firebaseUser, handleLogout]);
  
  // Handle mobile nav item click
  const handleMobileItemClick = (item) => {
    // If item has onClick handler, call it
    if (typeof item.onClick === 'function') {
      item.onClick();
    }
    // If item has path, navigate to it
    else if (item.path) {
      navigate(item.path);
    }
    // Close drawer
    setOpen(false);
  };
  
  // Mobile drawer content
  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          bgcolor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Typography variant="h6" component="div">
          Invoice Tracker
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        {navItems && Array.isArray(navItems) && navItems.length > 0
          ? navItems
              .filter(item => item && !item.hide)
              .map((item) => (
                <ListItem key={item.name} disablePadding>
                  {item.to ? (
                    <ListItemButton 
                      component={Link} 
                      to={item.to}
                      onClick={() => handleMobileItemClick(item)}
                      selected={location.pathname === item.path}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        },
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItemButton>
                  ) : (
                    <ListItemButton 
                      onClick={() => handleMobileItemClick(item)}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItemButton>
                  )}
                </ListItem>
              ))
          : null}
      </List>
    </Box>
  );
  
  // Add a function to open GitHub profile
  const openGitHubProfile = () => {
    window.open('https://github.com/kafilcodes', '_blank');
  };
  
  return (
    <>
      <GlobalStyles
        styles={{
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            background: 'transparent',
            borderRadius: '6px',
            transition: 'background 0.3s ease',
          },
          '*:hover::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.3)'
              : 'rgba(0, 0, 0, 0.3)',
          },
        }}
      />
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: 0,
              boxShadow: 3,
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              ...(open ? {
                width: drawerWidth,
                overflowX: 'hidden'
              } : {
                width: theme.spacing(7),
                overflowX: 'hidden'
              })
            },
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main',
            color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              {open ? (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  cursor: 'pointer',
                }}
                onClick={openGitHubProfile}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                    <img 
                      src={billLogo} 
                      alt="Invoice Tracker" 
                      style={{ 
                        width: 24, 
                        height: 24,
                        marginRight: 8,
                        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                      }} 
                    />
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      Invoice Tracker
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  cursor: 'pointer',
                }}
                onClick={openGitHubProfile}
                >
                  <img 
                    src={billLogo} 
                    alt="Invoice Tracker" 
                    style={{ 
                      width: 24, 
                      height: 24,
                      filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                    }} 
                  />
                </Box>
              )}
              <IconButton
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: '50%',
                  p: 1,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                {open ? <ChevronLeftIcon /> : <MenuOpenIcon />}
              </IconButton>
            </Box>

            <Box
              sx={{
                display: open ? 'flex' : 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: theme.spacing(3, 2),
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'background.default' 
                  : 'primary.dark',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: theme.palette.mode === 'dark'
                    ? 'radial-gradient(circle at center, rgba(25, 118, 210, 0.15) 0%, rgba(0, 0, 0, 0) 70%)'
                    : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)',
                  zIndex: 0
                }
              }}
            >
              <Avatar
                alt={displayName}
                src={photoURL || '/default-avatar.png'}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 1.5,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                  border: `3px solid ${theme.palette.background.paper}`,
                  zIndex: 1,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.3s ease'
                  }
                }}
              />
              {open && (
                <>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText',
                      textAlign: 'center',
                      zIndex: 1
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? 'text.secondary' : 'rgba(255,255,255,0.7)',
                      mb: 1,
                      textAlign: 'center',
                      zIndex: 1
                    }}
                  >
                    {user?.email || firebaseUser?.email || "user@example.com"}
                  </Typography>
                  
                  {/* Organization and department section - ALWAYS VISIBLE if org exists */}
                  {userOrganization && (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.5,
                      mb: 1.5,
                      zIndex: 1,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0,0,0,0.1)',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      width: 'fit-content'
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'white' : 'primary.contrastText',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          letterSpacing: '0.02em',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <BusinessIcon sx={{ fontSize: 14, mr: 0.5 }} />
                        {userOrganization}
                        {userDepartment && (
                          <>
                            <Box component="span" sx={{ mx: 0.5 }}>|</Box>
                            {userDepartment}
                          </>
                        )}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    zIndex: 1
                  }}>
                    <Chip
                      size="small"
                      label={userRole}
                      color={userRole.toLowerCase() === 'admin' ? "error" : "secondary"}
                      icon={<AdminPanelIcon sx={{ fontSize: '16px !important' }} />}
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 24,
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
            <Divider />
          </Box>
          
          <List component={motion.div}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            sx={{
              px: 1,
              py: 2,
              flexGrow: 1,
              '& .MuiListItemButton-root': {
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: theme.palette.mode === 'dark' ? 'action.selected' : 'primary.light',
                  color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.dark',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'primary.main',
                    color: 'primary.contrastText'
                  }
                },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'rgba(0, 0, 0, 0.04)',
                }
              }
            }}>
            {navItems && Array.isArray(navItems) ? navItems.filter(item => item && !item.hide).map((item, index) => {
              return (
                <motion.div
                  key={item.name || item.text || `nav-item-${index}`}
                  variants={listItemVariants}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ListItem 
                    disablePadding
                    sx={{
                      ...getGradientBorder(index),
                      mb: 0.5,
                    }}
                    className={location.pathname === item.to || location.pathname === item.path ? 'active' : ''}
                  >
                    <ListItemButton
                      onClick={() => handleItemClick(item)}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: 1,
                        mx: 1,
                        backgroundColor: (location.pathname === item.to || location.pathname === item.path)
                          ? theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)'
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.12)' 
                            : 'rgba(0, 0, 0, 0.08)',
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2 : 'auto',
                          justifyContent: 'center',
                          color: (location.pathname === item.to || location.pathname === item.path) 
                                 ? theme.palette.primary.main : 'inherit'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.name || item.text} 
                        sx={{ 
                          opacity: open ? 1 : 0,
                          '& .MuiTypography-root': {
                            fontWeight: (location.pathname === item.to || location.pathname === item.path) ? 'bold' : 'regular',
                            color: theme.palette.mode === 'dark' 
                              ? 'text.primary' 
                              : ((location.pathname === item.to || location.pathname === item.path) 
                                 ? theme.palette.primary.main 
                                 : 'inherit')
                          }
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              );
            }) : null}
          </List>

          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: open ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.4)' : 'rgba(240, 240, 240, 0.4)',
            }}
          >
            <Typography variant="caption" color="text.secondary" align="center">
              Invoice Tracker v1.0
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center">
              © 2025 All Rights Reserved
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={openGitHubProfile}
            >
              <GitHubIcon fontSize="small" sx={{ fontSize: '14px' }} />
              Made by kafilcodes
            </Typography>
          </Box>
        </Drawer>

        <Box component="main" sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
        }}>
          {/* Content will be rendered here */}
        </Box>
      </Box>
    </>
  );
};

export default NavBar; 