import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  CircularProgress, 
  Avatar, 
  Box, 
  Typography, 
  FormHelperText,
  Paper,
  Chip,
  ListSubheader,
  useTheme
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon,
  Business as BusinessIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import { ref, get } from 'firebase/database';
import { rtdb } from '../../firebase/config';

/**
 * An enhanced component that allows selecting users from an organization
 * with improved search, UI, and showing all users with organization filtering
 * 
 * @param {Object} props
 * @param {string} props.organizationId - The ID of the organization to fetch users from
 * @param {Array} props.selectedUsers - Array of currently selected users
 * @param {Function} props.onChange - Callback function when selection changes
 * @param {string} props.label - Label for the input field
 * @param {boolean} props.multiple - Whether multiple users can be selected
 * @param {Array} props.excludeUsers - Array of user IDs to exclude from the options
 * @param {boolean} props.error - Whether there is an error
 * @param {string} props.helperText - Helper text to display (usually error message)
 */
const UserSelector = ({
  organizationId,
  selectedUsers = [],
  onChange,
  label = 'Select Users',
  multiple = false,
  excludeUsers = [],
  error = false,
  helperText = ''
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  
  // Fetch all users from Realtime Database
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch all users from Realtime Database
        const usersRef = ref(rtdb, 'users');
        const snapshot = await get(usersRef);
        
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          
          // Convert object to array and add the id as a property
          const fetchedUsers = Object.entries(usersData).map(([id, userData]) => ({
            id,
            ...userData,
            isFromMyOrg: userData.organizationId === organizationId
          }));
          
          // Filter out excluded users
          const filteredUsers = fetchedUsers.filter(user => !excludeUsers.includes(user.id));
          
          // Separate organization users from other users
          const myOrgUsers = filteredUsers.filter(user => user.isFromMyOrg);
          const usersFromOtherOrgs = filteredUsers.filter(user => !user.isFromMyOrg);
          
          setAllUsers(filteredUsers);
          setOrgUsers(myOrgUsers);
          setOtherUsers(usersFromOtherOrgs);
        } else {
          console.log("No users found in the database");
          setAllUsers([]);
          setOrgUsers([]);
          setOtherUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [organizationId, excludeUsers]);
  
  // Filter users based on search term (improved to match partial input)
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) {
      // Return all users when no search term
      return [...orgUsers, ...otherUsers];
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filter function that matches any part of name or email
    const filterFn = user => {
      const displayName = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return displayName.includes(searchLower) || 
             email.includes(searchLower);
    };
    
    // Apply filter to both user groups
    const filteredOrgUsers = orgUsers.filter(filterFn);
    const filteredOtherUsers = otherUsers.filter(filterFn);
    
    // Return combined filtered results
    return [...filteredOrgUsers, ...filteredOtherUsers];
  };
  
  // Handle change events
  const handleChange = (event, newValue) => {
    if (multiple) {
      onChange(newValue);
    } else {
      onChange(newValue ? [newValue] : []);
    }
  };
  
  // Get the option label
  const getOptionLabel = (option) => {
    return option.displayName || option.email || '';
  };
  
  // Custom group rendering
  const renderGroup = (params) => {
    return (
      <li key={params.key}>
        <ListSubheader
          sx={{
            bgcolor: theme.palette.background.default,
            lineHeight: '30px',
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          {params.group === 'My Organization' ? (
            <BusinessIcon sx={{ mr: 1, fontSize: '1rem' }} />
          ) : (
            <PersonOutlineIcon sx={{ mr: 1, fontSize: '1rem' }} />
          )}
          {params.group}
        </ListSubheader>
        <ul style={{ padding: 0 }}>{params.children}</ul>
      </li>
    );
  };
  
  const filteredUsers = getFilteredUsers();
  
  return (
    <Box>
      <Autocomplete
        multiple={multiple}
        options={filteredUsers}
        loading={loading}
        value={multiple ? selectedUsers : selectedUsers[0] || null}
        onChange={handleChange}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        groupBy={option => option.isFromMyOrg ? 'My Organization' : 'Other Organizations'}
        renderGroup={renderGroup}
        PaperComponent={props => (
          <Paper 
            elevation={8} 
            {...props} 
            sx={{ 
              maxHeight: 350, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              }
            }} 
          />
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={error}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={multiple ? "Search and select reviewers..." : "Search for a reviewer..."}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <PersonAddIcon color="primary" sx={{ ml: 1, mr: 0.5, opacity: 0.7 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          // Add custom styling based on organization membership
          const isFromMyOrg = option.isFromMyOrg;
          
          return (
            <li 
              {...props} 
              style={{
                ...props.style,
                opacity: isFromMyOrg ? 1 : 0.7,
              }}
            >
              <Box display="flex" alignItems="center" width="100%">
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 1,
                    bgcolor: isFromMyOrg ? 'primary.main' : 'text.disabled',
                    border: isFromMyOrg ? `2px solid ${theme.palette.primary.light}` : 'none'
                  }}
                  src={option.photoURL || ''}
                >
                  {option.displayName?.charAt(0).toUpperCase() || option.email?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <Box ml={1} width="calc(100% - 40px)" overflow="hidden">
                  <Typography 
                    variant="body2" 
                    component="span" 
                    sx={{ 
                      fontWeight: isFromMyOrg ? 600 : 400,
                      color: isFromMyOrg ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {option.displayName || option.email}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography 
                      variant="caption" 
                      display="block" 
                      color="text.secondary"
                      sx={{ maxWidth: '170px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
                    >
                      {option.email}
                    </Typography>
                    
                    {option.isFromMyOrg ? (
                      <Chip 
                        label="Organization Member" 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ 
                          height: '20px', 
                          '& .MuiChip-label': { 
                            fontSize: '0.625rem',
                            px: 0.5
                          } 
                        }}
                      />
                    ) : (
                      <Chip 
                        label="External" 
                        size="small" 
                        color="default" 
                        variant="outlined"
                        sx={{ 
                          height: '20px', 
                          '& .MuiChip-label': { 
                            fontSize: '0.625rem',
                            px: 0.5
                          } 
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </li>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.displayName || option.email}
              avatar={
                <Avatar 
                  src={option.photoURL || ''}
                  alt={option.displayName || option.email}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  {option.displayName?.charAt(0).toUpperCase() || option.email?.charAt(0).toUpperCase() || '?'}
                </Avatar>
              }
              sx={{ 
                bgcolor: 'background.paper', 
                '& .MuiChip-label': { 
                  fontWeight: 500,
                  color: 'text.primary'
                } 
              }}
            />
          ))
        }
      />
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </Box>
  );
};

export default UserSelector; 