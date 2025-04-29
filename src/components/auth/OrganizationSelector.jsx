import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Paper,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Business as BusinessIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { debounce } from 'lodash';
import realtimeDb from '../../firebase/realtimeDb';

/**
 * Component for searching and selecting organizations during signup
 * 
 * @param {Object} props
 * @param {string} props.value - Current selected organization
 * @param {Function} props.onChange - Function to call when organization is selected
 */
const OrganizationSelector = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load all organizations on component mount
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoading(true);
      setError('');
      
      try {
        const result = await realtimeDb.getItems('organizations');
        
        if (result.success && Array.isArray(result.data)) {
          // Get additional details for each organization
          const orgsWithDetails = await Promise.all(result.data.map(async (org) => {
            // Get member count
            let members = [];
            let adminsCount = 0;
            let reviewersCount = 0;
            
            try {
              const membersResult = await realtimeDb.getData(`organizations/${org.id}/members`);
              if (membersResult.success && membersResult.data) {
                members = Object.values(membersResult.data);
                adminsCount = members.filter(m => m.role === 'admin').length;
                reviewersCount = members.filter(m => m.role === 'reviewer').length;
              }
            } catch (err) {
              console.error('Error fetching members for org:', org.id, err);
            }
            
            // Get admin name from creator
            let creatorName = '';
            if (org.createdBy) {
              try {
                const creatorResult = await realtimeDb.getData(`users/${org.createdBy}`);
                if (creatorResult.success && creatorResult.data) {
                  creatorName = creatorResult.data.displayName || creatorResult.data.email;
                }
              } catch (err) {
                console.error('Error fetching creator for org:', org.id, err);
              }
            }
            
            return {
              ...org,
              membersCount: members.length,
              adminsCount,
              reviewersCount,
              creatorName
            };
          }));
          
          setOrganizations(orgsWithDetails);
          setFilteredOrgs(orgsWithDetails);
        } else {
          setError('Failed to load organizations. Please try again.');
        }
      } catch (err) {
        console.error('Error loading organizations:', err);
        setError('An error occurred while loading organizations.');
      } finally {
        setLoading(false);
      }
    };
    
    loadOrganizations();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (!term.trim()) {
        setFilteredOrgs(organizations);
        return;
      }
      
      const lowerTerm = term.toLowerCase();
      const filtered = organizations.filter(org => 
        (org.name && org.name.toLowerCase().includes(lowerTerm)) ||
        (org.description && org.description.toLowerCase().includes(lowerTerm)) ||
        (org.creatorName && org.creatorName.toLowerCase().includes(lowerTerm))
      );
      
      setFilteredOrgs(filtered);
    }, 300),
    [organizations]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // Handle organization selection
  const handleSelectOrg = (org) => {
    onChange(org.name);
  };

  // Generate organization avatar
  const getOrgAvatar = (org) => {
    if (org.logo) {
      return <Avatar src={org.logo} alt={org.name} />;
    }
    
    // Create a color from the org name
    const stringToColor = (string) => {
      let hash = 0;
      for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      let color = '#';
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
      }
      
      return color;
    };
    
    // Get initials for avatar
    const getInitials = (name) => {
      if (!name) return 'O';
      return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };
    
    return (
      <Avatar
        sx={{
          bgcolor: stringToColor(org.name || 'Organization'),
          color: '#fff',
          fontWeight: 'bold'
        }}
      >
        {getInitials(org.name)}
      </Avatar>
    );
  };

  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <Typography 
        variant="subtitle1" 
        sx={{ mb: 1, fontWeight: 500, fontFamily: '"Poppins", sans-serif' }}
      >
        Select your organization:
      </Typography>
      
      <TextField
        fullWidth
        placeholder="Search organizations..."
        value={searchTerm}
        onChange={handleSearchChange}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: loading && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          )
        }}
        sx={{
          mb: 1.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper 
        sx={{ 
          maxHeight: 240, // Fixed height
          height: filteredOrgs.length > 0 ? 240 : 'auto',
          overflow: 'hidden',
          borderRadius: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {filteredOrgs.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              {loading ? 'Loading organizations...' : 'No organizations found'}
            </Typography>
          </Box>
        ) : (
          <List 
            dense 
            sx={{ 
              overflow: 'auto', 
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {filteredOrgs.map((org, index) => (
              <React.Fragment key={org.id || index}>
                <ListItem 
                  button 
                  onClick={() => handleSelectOrg(org)}
                  selected={value === org.name}
                  sx={{
                    py: 1.5,
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(79, 70, 229, 0.15)'
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                  alignItems="flex-start"
                >
                  <ListItemAvatar>
                    {getOrgAvatar(org)}
                  </ListItemAvatar>
                  
                  <ListItemText 
                    primary={
                      <Typography
                        variant="body1"
                        fontWeight={value === org.name ? 600 : 400}
                        color={value === org.name ? 'primary.main' : 'text.primary'}
                        sx={{ mb: 0.5 }}
                      >
                        {org.name || 'Unnamed Organization'}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        {org.creatorName && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <AdminIcon fontSize="inherit" sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                            Created by {org.creatorName}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                          <Tooltip title="Administrators">
                            <Chip 
                              icon={<AdminIcon fontSize="small" />} 
                              label={org.adminsCount || 0} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                            />
                          </Tooltip>
                          
                          <Tooltip title="Reviewers">
                            <Chip 
                              icon={<PersonIcon fontSize="small" />} 
                              label={org.reviewersCount || 0} 
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                            />
                          </Tooltip>
                        </Box>
                        
                        {org.description && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0.5 }}>
                            <DescriptionIcon fontSize="small" sx={{ mr: 0.5, mt: 0.2, fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {org.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredOrgs.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
      
      {value && (
        <Typography 
          variant="body2" 
          sx={{ mt: 1, color: 'success.main', fontWeight: 500 }}
        >
          Selected organization: {value}
        </Typography>
      )}
    </Box>
  );
};

export default OrganizationSelector; 