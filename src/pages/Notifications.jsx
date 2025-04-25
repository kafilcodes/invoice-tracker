import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';
import realtimeDb from '../firebase/realtimeDatabase';
import { motion } from 'framer-motion';

const NotificationsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await realtimeDb.getNotifications(user.uid);
        
        if (response.success && response.data) {
          const notificationsArray = Object.entries(response.data).map(([id, data]) => ({
            id,
            ...data
          })).sort((a, b) => {
            // Sort by timestamp (newest first)
            return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
          });
          
          setNotifications(notificationsArray);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time listener
    const unsubscribe = realtimeDb.subscribeToNotifications(user.uid, (data, error) => {
      if (error) {
        console.error('Error in notification subscription:', error);
        return;
      }
      
      if (data) {
        const notificationsArray = Object.entries(data).map(([id, notifData]) => ({
          id,
          ...notifData
        })).sort((a, b) => {
          // Sort by timestamp (newest first)
          return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
        });
        
        setNotifications(notificationsArray);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleMarkAsRead = async (notificationId) => {
    if (!user?.uid) return;
    
    try {
      await realtimeDb.markNotificationAsRead(user.uid, notificationId);
      // The real-time listener will update the UI
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!user?.uid) return;
    
    try {
      await realtimeDb.deleteNotification(user.uid, notificationId);
      // The real-time listener will update the UI
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!user?.uid) return;
    
    try {
      await realtimeDb.deleteAllNotifications(user.uid);
      // The real-time listener will update the UI
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    
    try {
      await realtimeDb.markAllNotificationsAsRead(user.uid);
      // The real-time listener will update the UI
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Function to render notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ClearIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 2, fontSize: 30, color: 'primary.main' }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Notifications
                {unreadCount > 0 && (
                  <Chip 
                    label={`${unreadCount} unread`} 
                    color="error" 
                    size="small" 
                    sx={{ ml: 2, verticalAlign: 'middle' }}
                  />
                )}
              </Typography>
            </Box>
            <Box>
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mr: 2 }}
                onClick={handleMarkAllAsRead}
                startIcon={<MarkReadIcon />}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={handleClearAllNotifications}
                startIcon={<DeleteIcon />}
                disabled={notifications.length === 0}
              >
                Clear all
              </Button>
            </Box>
          </Box>
        </motion.div>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'error.light', color: 'error.contrastText' }}>
            <Typography>{error}</Typography>
          </Paper>
        ) : notifications.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
              <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                When you receive notifications, they will appear here
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <Grid container spacing={2}>
            {notifications.map((notification) => (
              <Grid item xs={12} md={6} key={notification.id}>
                <motion.div variants={itemVariants}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      boxShadow: notification.read ? 1 : 3,
                      borderLeft: '4px solid',
                      borderColor: notification.type === 'success' ? 'success.main' :
                                  notification.type === 'warning' ? 'warning.main' :
                                  notification.type === 'error' ? 'error.main' : 'info.main',
                      opacity: notification.read ? 0.8 : 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', flexGrow: 1 }}>
                          <ListItemIcon sx={{ minWidth: 42, mt: 0.5 }}>
                            {getNotificationIcon(notification.type)}
                          </ListItemIcon>
                          <Box>
                            <Typography 
                              variant="body1" 
                              component="div" 
                              fontWeight={notification.read ? 'regular' : 'bold'}
                            >
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'Unknown date'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          {!notification.read && (
                            <Tooltip title="Mark as read">
                              <IconButton 
                                size="small" 
                                onClick={() => handleMarkAsRead(notification.id)}
                                sx={{ mr: 1 }}
                              >
                                <MarkReadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteNotification(notification.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </motion.div>
    </Box>
  );
};

export default NotificationsPage; 