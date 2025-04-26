import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  CheckCircle as ApprovedIcon,
  Create as CreateIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import databaseService from '../firebase/database';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import { format, formatDistance } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

const ActivityLogs = () => {
  const theme = useTheme();
  const user = useSelector(selectUser);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [organizationName, setOrganizationName] = useState('');

  // Fetch logs when component mounts
  useEffect(() => {
    if (user?.uid) {
      fetchActivityLogs();
    }
  }, [user]);
  
  // Function to fetch organization ID and name
  const getOrganizationId = async () => {
    if (organizationId) return organizationId;
    
    try {
      const userDataResult = await databaseService.getData(`users/${user.uid}`);
      
      if (!userDataResult.success || !userDataResult.data?.organization) {
        throw new Error('Failed to get organization information');
      }
      
      const orgId = userDataResult.data.organization;
      setOrganizationId(orgId);
      
      // Get organization name
      const orgResult = await databaseService.getData(`organizations/${orgId}`);
      if (orgResult.success && orgResult.data?.name) {
        setOrganizationName(orgResult.data.name);
      }
      
      return orgId;
    } catch (error) {
      console.error('Error getting organization ID:', error);
      setError('Failed to get organization information');
      return null;
    }
  };
  
  // Fetch activity logs
  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orgId = await getOrganizationId();
      if (!orgId) return;
      
      // Get activity logs
      const activityResult = await databaseService.getData(`organizations/${orgId}/activity`);
      
      if (activityResult.success && activityResult.data) {
        // Convert object to array and add IDs
        const logsArray = Object.entries(activityResult.data).map(([id, log]) => ({
          id,
          ...log
        }));
        
        // Sort by timestamp (newest first)
        logsArray.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
          const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
          return dateB - dateA;
        });
        
        setLogs(logsArray);
      } else {
        setLogs([]);
        setError('No activity logs found. The system will record activities as they occur.');
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      setLogs([]);
      setError('An error occurred while fetching activity logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Format timestamp to readable date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      return format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Get relative time (e.g., "2 hours ago")
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  // Get icon for activity type
  const getActivityIcon = (log) => {
    switch (log.type) {
      case 'invoice_created':
        return <CreateIcon />;
      case 'invoice_updated':
        return <UpdateIcon />;
      case 'invoice_deleted':
        return <DeleteIcon />;
      case 'invoice_status_changed':
        return <ApprovedIcon />;
      case 'invoice_paid':
        return <PaymentIcon />;
      case 'user_login':
        return <BusinessIcon />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Get color for activity type
  const getActivityColor = (log) => {
    switch (log.type) {
      case 'invoice_created':
        return theme.palette.primary.main;
      case 'invoice_updated':
        return theme.palette.info.main;
      case 'invoice_deleted':
        return theme.palette.error.main;
      case 'invoice_status_changed':
        return theme.palette.success.main;
      case 'invoice_paid':
        return theme.palette.secondary.main;
      case 'user_login':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Get description for activity log
  const getActivityDescription = (log) => {
    switch (log.type) {
      case 'invoice_created':
        return `Invoice #${log.invoiceNumber || log.details?.invoiceNumber || 'Unknown'} was created`;
      case 'invoice_updated':
        return `Invoice #${log.invoiceNumber || log.details?.invoiceNumber || 'Unknown'} was updated`;
      case 'invoice_deleted':
        return `Invoice #${log.invoiceNumber || log.details?.invoiceNumber || 'Unknown'} was deleted`;
      case 'invoice_status_changed':
        return `Invoice #${log.invoiceNumber || log.details?.invoiceNumber || 'Unknown'} status changed to ${log.newStatus || log.details?.newStatus || 'unknown'}`;
      case 'invoice_paid':
        return `Invoice #${log.invoiceNumber || log.details?.invoiceNumber || 'Unknown'} was marked as paid`;
      case 'user_login':
        return `User logged in to the system`;
      default:
        return log.description || log.details?.description || 'Activity recorded';
    }
  };

  // Get user name or ID who performed the action
  const getPerformerName = (log) => {
    return log.performedBy?.name || log.details?.performedBy?.name || log.userId || 'System';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">Organization Activity Flow</Typography>
            {organizationName && (
              <Typography variant="subtitle1" color="text.secondary">
                {organizationName}
              </Typography>
            )}
          </Box>
          <Tooltip title="Refresh Activities">
            <IconButton onClick={fetchActivityLogs} disabled={loading} sx={{ ml: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography color="text.secondary">{error}</Typography>
          </Paper>
        ) : (
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              overflow: 'hidden',
              borderRadius: 2,
              background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Timeline position="right" sx={{ 
              p: 0, 
              [`& .MuiTimelineItem-root:before`]: {
                flex: 0,
                padding: 0
              }
            }}>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <TimelineItem key={log.id}>
                    <TimelineSeparator>
                      <TimelineDot sx={{ 
                        backgroundColor: getActivityColor(log),
                        boxShadow: `0 0 10px ${getActivityColor(log)}40`,
                        p: 1
                      }}>
                        {getActivityIcon(log)}
                      </TimelineDot>
                      {index < logs.length - 1 && (
                        <TimelineConnector sx={{ 
                          height: 40,
                          background: `linear-gradient(to bottom, ${getActivityColor(log)}, ${getActivityColor(logs[index + 1])})`
                        }} />
                      )}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Box sx={{ 
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(255, 255, 255, 0.9)',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 6px 25px rgba(0,0,0,0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Typography variant="body1" fontWeight="medium">
                          {getActivityDescription(log)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {getPerformerName(log)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getTimeAgo(log.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                ))
              ) : (
                <Box sx={{ width: '100%', py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No activity logs found</Typography>
                </Box>
              )}
            </Timeline>
          </Paper>
        )}
      </Box>
    </motion.div>
  );
};

export default ActivityLogs; 