import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  AssignmentTurnedIn as ApprovedIcon,
  HighlightOff as RejectedIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Create as CreateIcon,
  Update as UpdateIcon,
  DeleteOutline as DeleteIcon,
  Info as InfoIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import realtimeDb from '../firebase/realtimeDatabase';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';

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
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [uniqueUsers, setUniqueUsers] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await realtimeDb.getData('activity_logs');
        
        if (response.success) {
          if (response.data) {
            // Convert to array and sort by timestamp (newest first)
            const logsArray = Object.entries(response.data).map(([id, log]) => ({
              id,
              ...log
            })).sort((a, b) => 
              (b.timestamp || 0) - (a.timestamp || 0)
            );
            
            setLogs(logsArray);
            setFilteredLogs(logsArray);
            
            // Extract unique user IDs for filtering
            const users = [...new Set(logsArray.map(log => log.userId))].filter(Boolean);
            setUniqueUsers(users);
          } else {
            // No logs yet, but not an error
            setLogs([]);
            setFilteredLogs([]);
          }
          setError(null);
        } else {
          setLogs([]);
          setFilteredLogs([]);
          setError('No activity logs found. The system will record activities as they occur.');
        }
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setLogs([]);
        setFilteredLogs([]);
        setError('An error occurred while fetching activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Set up real-time listener
    const unsubscribe = realtimeDb.subscribeToData('activity_logs', (data, error) => {
      setLoading(false);
      
      if (error) {
        console.error('Error in activity logs subscription:', error);
        setError('Failed to sync with activity logs');
        return;
      }
      
      if (data) {
        const logsArray = Object.entries(data).map(([id, log]) => ({
          id,
          ...log
        })).sort((a, b) => 
          (b.timestamp || 0) - (a.timestamp || 0)
        );
        
        setLogs(logsArray);
        
        // Apply current filters
        filterLogs(logsArray, searchTerm, filterType, filterUser);
        
        // Extract unique user IDs
        const users = [...new Set(logsArray.map(log => log.userId))].filter(Boolean);
        setUniqueUsers(users);
        setError(null);
      } else {
        setLogs([]);
        setFilteredLogs([]);
        // Not setting error here since empty data is valid
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    filterLogs(logs, searchTerm, filterType, filterUser);
  }, [searchTerm, filterType, filterUser]);

  const filterLogs = (logsArray, search, type, userId) => {
    let filtered = [...logsArray];
    
    // Filter by search term (check in description and details)
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(log => 
        (log.description && log.description.toLowerCase().includes(lowerSearch)) ||
        (log.details && log.details.toLowerCase().includes(lowerSearch)) ||
        (log.entityId && log.entityId.toLowerCase().includes(lowerSearch)) ||
        (log.userName && log.userName.toLowerCase().includes(lowerSearch))
      );
    }
    
    // Filter by activity type
    if (type !== 'all') {
      filtered = filtered.filter(log => log.type === type);
    }
    
    // Filter by user
    if (userId !== 'all') {
      filtered = filtered.filter(log => log.userId === userId);
    }
    
    setFilteredLogs(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
  };

  const handleFilterUserChange = (event) => {
    setFilterUser(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterUser('all');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'create':
        return <CreateIcon color="primary" />;
      case 'update':
        return <UpdateIcon color="info" />;
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'approve':
        return <ApprovedIcon color="success" />;
      case 'reject':
        return <RejectedIcon color="error" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'user':
        return <PersonIcon color="secondary" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getActivityTypeChip = (type) => {
    const typeConfig = {
      create: { color: 'primary', label: 'Create' },
      update: { color: 'info', label: 'Update' },
      delete: { color: 'error', label: 'Delete' },
      approve: { color: 'success', label: 'Approve' },
      reject: { color: 'error', label: 'Reject' },
      pending: { color: 'warning', label: 'Pending' },
      user: { color: 'secondary', label: 'User' },
      role: { color: 'secondary', label: 'Role' }
    };
    
    const config = typeConfig[type] || { color: 'default', label: type || 'Unknown' };
    
    return (
      <Chip 
        size="small" 
        color={config.color} 
        label={config.label}
        icon={getActivityIcon(type)}
        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
      />
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3, maxWidth: '100%' }}>
        <Typography variant="h4" gutterBottom fontWeight="medium">
          Activity Logs
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
          View a complete history of activities and changes in the system.
        </Typography>
        
        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2 
          }}>
            <TextField
              placeholder="Search logs..."
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterType}
                onChange={handleFilterTypeChange}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="approve">Approve</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterUser}
                onChange={handleFilterUserChange}
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Users</MenuItem>
                {uniqueUsers.map(userId => (
                  <MenuItem key={userId} value={userId}>
                    {logs.find(log => log.userId === userId)?.userName || userId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {(searchTerm || filterType !== 'all' || filterUser !== 'all') && (
              <Tooltip title="Clear all filters">
                <IconButton onClick={handleClearFilters} color="primary" size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Paper>
        
        {/* Activity Logs Table */}
        <Paper 
          elevation={3} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            height: 'calc(100vh - 300px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Paper 
              sx={{ 
                p: 3, 
                textAlign: 'center', 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', 
                borderRadius: 2,
                borderLeft: '4px solid',
                borderColor: 'info.main'
              }}
            >
              <InfoIcon sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
              <Typography>{error}</Typography>
            </Paper>
          ) : filteredLogs.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 5, 
                textAlign: 'center', 
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center' }}
              >
                <Typography 
                  variant="h1" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '3.5rem',
                    mb: 2,
                    opacity: 0.7
                  }}
                >
                  📋
                </Typography>
                <Typography variant="h5" color="text.secondary" fontWeight="medium">
                  No activity logs found yet! 😢
                </Typography>
                {searchTerm || filterType !== 'all' || filterUser !== 'all' ? (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    Try adjusting your filters or search criteria
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    Activity logs will appear here when you or other users perform actions in the system
                  </Typography>
                )}
                <Box 
                  sx={{ 
                    mt: 3, 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                    display: 'inline-block' 
                  }}
                >
                  <Typography variant="body2" color="primary.main">
                    Try creating or reviewing an invoice to generate activity logs!
                  </Typography>
                </Box>
              </motion.div>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ flexGrow: 1 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log, index) => (
                        <TableRow 
                          key={log.id || index}
                          hover
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255, 255, 255, 0.05)' 
                                : 'rgba(0, 0, 0, 0.02)'
                            }
                          }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            {getActivityTypeChip(log.type)}
                          </TableCell>
                          <TableCell>
                            {log.description || 'No description'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Tooltip title={log.userId || 'Unknown user ID'}>
                                <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
                              </Tooltip>
                              {log.userName || 'Unknown user'}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                              {log.entityId && (
                                <Typography variant="body2" component="span" color="primary" sx={{ mr: 1 }}>
                                  {log.entityType}: {log.entityId}
                                </Typography>
                              )}
                              {log.details && (
                                <Typography variant="body2" color="text.secondary">
                                  {log.details}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider />
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Box>
    </motion.div>
  );
};

export default ActivityLogs; 