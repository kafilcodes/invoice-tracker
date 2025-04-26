import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  Alert,
  Snackbar,
  SwipeableDrawer,
  useTheme,
  useMediaQuery,
  Avatar,
  Fade,
  LinearProgress,
  Tab,
  Tabs,
  Skeleton,
} from '@mui/material';
import {
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  LeadingActions,
} from 'react-swipeable-list';
import {
  Add,
  FilterList,
  Search,
  Visibility,
  CheckCircle,
  Cancel,
  Paid,
  PendingActions,
  Edit,
  KeyboardArrowDown,
  KeyboardArrowUp,
  HistoryEdu,
  AttachFile,
  Delete,
  MoreVert,
  AutorenewRounded,
  ArrowUpward,
  ArrowDownward,
  FilterAlt,
  Assignment,
  AttachMoney,
  Business,
  EventNote,
  CalendarToday,
  Schedule,
  Alarm,
  RestartAlt,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getInvoices, updateInvoice, updateInvoiceStatus, deleteInvoice } from '../redux/slices/invoiceSlice';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-swipeable-list/dist/styles.css';
import databaseService from "../firebase/database";

// Define the constant for pagination
const ITEMS_PER_PAGE = 10;

// Transition for slide animation
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Detailed view component for expanded invoice data
const InvoiceDetailContent = ({ 
  invoice, 
  statusInfo, 
  formatCurrency, 
  handleUpdateStatus,
  handleOpenEditDrawer,
  user
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="invoice details tabs"
        >
          <Tab label="Details" icon={<Assignment />} iconPosition="start" />
          {invoice.attachments?.length > 0 && (
            <Tab label="Attachments" icon={<AttachFile />} iconPosition="start" />
          )}
        </Tabs>
      </Box>

      {/* Details Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader
                title="Invoice Information"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Invoice Number:</Typography>
                    <Typography variant="body2" fontWeight="medium">{invoice.invoiceNumber}</Typography>
                  </Box>
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Vendor:</Typography>
                    <Typography variant="body2">{invoice.vendorName}</Typography>
                  </Box>
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Amount:</Typography>
                    <Typography variant="body2" fontWeight="medium">{formatCurrency(invoice.amount)}</Typography>
                  </Box>
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status:</Typography>
                    <Chip
                      label={invoice.status ? (invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)) : 'Pending'}
                      color={statusInfo.color}
                      size="small"
                      icon={statusInfo.icon}
                    />
                  </Box>
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                    <Typography variant="body2">
                      {invoice.dueDate && format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Created:</Typography>
                    <Typography variant="body2">
                      {invoice.createdAt && format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader
                title="Additional Information"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>Description:</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: theme.palette.background.default }}>
                  <Typography variant="body2">
                    {invoice.description || 'No description provided'}
                  </Typography>
                </Paper>
                
                {/* Notes Section */}
                {invoice.notes && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Notes:</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: theme.palette.background.default }}>
                      <Typography variant="body2">
                        {invoice.notes}
                      </Typography>
                    </Paper>
                  </>
                )}
                
                {/* Status Note Section */}
                {invoice.statusNote && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Status Note:</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 2, backgroundColor: theme.palette.background.default }}>
                      <Typography variant="body2">
                        {invoice.statusNote}
                      </Typography>
                    </Paper>
                  </>
                )}
                
                {/* Status update section */}
                {(user?.role === 'admin' || user?.role === 'reviewer') && (
                  <>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3, fontWeight: 'bold', color: 'primary.main' }}>
                      Update Invoice Status
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 2, 
                      flexWrap: 'wrap', 
                      mt: 1,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: '1px dashed',
                      borderColor: 'primary.light'
                    }}>
                      {invoice.status !== 'pending' && (
                        <Button 
                          variant="contained" 
                          size="large" 
                          startIcon={<PendingActions />}
                          onClick={() => handleUpdateStatus(invoice, 'pending')}
                          sx={{ textTransform: 'none', borderRadius: 2, minWidth: 150 }}
                        >
                          Mark as Pending
                        </Button>
                      )}
                      {invoice.status !== 'approved' && (
                        <Button 
                          variant="contained" 
                          color="success" 
                          size="large" 
                          startIcon={<CheckCircle />}
                          onClick={() => handleUpdateStatus(invoice, 'approved')}
                          sx={{ textTransform: 'none', borderRadius: 2, minWidth: 150 }}
                        >
                          Approve
                        </Button>
                      )}
                      {invoice.status !== 'rejected' && (
                        <Button 
                          variant="contained" 
                          color="error" 
                          size="large" 
                          startIcon={<Cancel />}
                          onClick={() => handleUpdateStatus(invoice, 'rejected')}
                          sx={{ textTransform: 'none', borderRadius: 2, minWidth: 150 }}
                        >
                          Reject
                        </Button>
                      )}
                      {invoice.status !== 'paid' && (
                        <Button 
                          variant="contained" 
                          color="info" 
                          size="large" 
                          startIcon={<Paid />}
                          onClick={() => handleUpdateStatus(invoice, 'paid')}
                          sx={{ textTransform: 'none', borderRadius: 2, minWidth: 150 }}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </Box>
                  </>
                )}
                
                {/* Edit button */}
                {invoice.status === 'pending' && (user?.role === 'admin' || (user?.role === 'user' && invoice.createdBy === user.id)) && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpenEditDrawer(invoice)}
                    >
                      Edit Invoice
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Attachments Tab - now this is tab index 1 instead of 2 */}
      {activeTab === 1 && invoice.attachments && invoice.attachments.length > 0 && (
        <Card variant="outlined">
          <CardHeader
            title="Attachments"
            titleTypographyProps={{ variant: 'h6' }}
            sx={{ pb: 0 }}
          />
          <CardContent>
            <List>
              {invoice.attachments.map((attachment, idx) => (
                <ListItem 
                  key={`${invoice._id}-attachment-${idx}`} 
                  divider={idx !== invoice.attachments.length - 1}
                  sx={{ px: 2, borderRadius: 1 }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={1}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: theme.palette.secondary.main 
                      }}>
                        <AttachFile fontSize="small" />
                      </Avatar>
                    </Grid>
                    <Grid item xs={9}>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {attachment.name || `Attachment ${idx + 1}`}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {attachment.uploadedAt ? format(new Date(attachment.uploadedAt), 'MMM d, yyyy') : 'Unknown date'}
                          </Typography>
                        }
                      />
                    </Grid>
                    <Grid item xs={2} textAlign="right">
                      <Button
                        variant="outlined"
                        size="small"
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </Button>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </>
  );
};

// Mobile view component with swipeable list items
const MobileInvoiceList = ({
  invoices,
  lastInvoiceElementRef,
  expandedRow,
  handleRowExpand,
  formatCurrency,
  getStatusInfo,
  handleDeleteInvoice,
  handleOpenEditDrawer,
  handleUpdateStatus,
  user
}) => {
  const theme = useTheme();

  // Leading swipe actions (status update) - keep for both admin and reviewer
  const leadingActions = (invoice) => (
    <LeadingActions>
      <SwipeAction onClick={() => handleUpdateStatus(invoice, invoice.status === 'approved' ? 'pending' : 'approved')}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
            width: 80,
            px: 1,
          }}
        >
          {invoice.status === 'approved' ? <PendingActions /> : <CheckCircle />}
        </Box>
      </SwipeAction>
    </LeadingActions>
  );

  // Trailing swipe actions (delete)
  const trailingActions = (invoice) => (
    <TrailingActions>
      {user?.role === 'admin' && (
        <SwipeAction
          destructive={true}
          onClick={() => handleDeleteInvoice(invoice)}
        >
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              width: 80,
              px: 1,
            }}
          >
            <Delete />
          </Box>
        </SwipeAction>
      )}
    </TrailingActions>
  );

  return (
    <Box sx={{ 
      maxHeight: 'calc(100vh - 300px)', 
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
      },
    }}>
      <SwipeableList threshold={0.5}>
        {invoices.map((invoice, index) => {
          const statusInfo = getStatusInfo(invoice.status || 'pending');
          const isLastElement = index === invoices.length - 1;
          
          return (
            <SwipeableListItem
              key={`invoice-item-${invoice._id}`}
              leadingActions={
                (user?.role === 'admin' || user?.role === 'reviewer') 
                  ? leadingActions(invoice) 
                  : null
              }
              trailingActions={
                user?.role === 'admin'
                  ? trailingActions(invoice) 
                  : null
              }
              ref={isLastElement ? lastInvoiceElementRef : null}
            >
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 1.5,
                  cursor: 'pointer',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  boxShadow: theme.shadows[1],
                  border: expandedRow === invoice._id ? `1px solid ${theme.palette[statusInfo.color].main}` : 'none',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                }}
                onClick={() => handleRowExpand(invoice._id)}
                elevation={1}
              >
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {invoice.invoiceNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {invoice.vendorName}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {formatCurrency(invoice.amount)}
                    </Typography>
                    <Chip
                      label={invoice.status ? (invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)) : 'Pending'}
                      color={statusInfo.color}
                      size="small"
                      icon={statusInfo.icon}
                      sx={{ borderRadius: '4px' }}
                    />
                  </Grid>
                  
                  <Grid item xs={6} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Due: {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ mt: 1, textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {invoice.createdAt ? format(new Date(invoice.createdAt), 'MMM d, yyyy') : ''}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Collapse in={expandedRow === invoice._id} timeout="auto" unmountOnExit>
                      <Divider sx={{ my: 1.5 }} />
                      <InvoiceDetailContent 
                        invoice={invoice} 
                        statusInfo={statusInfo} 
                        formatCurrency={formatCurrency} 
                        handleUpdateStatus={handleUpdateStatus}
                        handleOpenEditDrawer={handleOpenEditDrawer}
                        user={user}
                      />
                    </Collapse>
                  </Grid>
                </Grid>
              </Paper>
            </SwipeableListItem>
          );
        })}
      </SwipeableList>
    </Box>
  );
};

// Add the DesktopInvoiceList component before the InvoiceList component
const DesktopInvoiceList = ({
  invoices,
  loading,
  hasMore,
  lastInvoiceElementRef,
  handleRowExpand,
  expandedRow,
  formatCurrency,
  getStatusInfo,
  handleDeleteInvoice,
  handleOpenEditDrawer,
  handleUpdateStatus,
  sort,
  handleSortChange,
  user
}) => {
  const theme = useTheme();
  
  // Helper function to render status action buttons - update to properly handle reviewers
  const renderStatusActions = (invoice) => {
    const currentStatus = invoice.status || 'pending';
    
    // Only show status actions if user has appropriate role (admin or reviewer)
    if (!(user?.role === 'admin' || user?.role === 'reviewer')) {
      return null;
    }
    
    return (
      <Box sx={{ 
        display: 'flex', 
        gap: 1.5, 
        justifyContent: 'center',
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'primary.main',
        boxShadow: 3,
        width: '100%'
      }}>
        {currentStatus !== 'approved' && (
          <Button 
            variant="contained" 
            size="medium"
            color="success"
            sx={{ 
              minWidth: 40,
              height: 40,
              p: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(invoice, 'approved');
            }}
          >
            <CheckCircle fontSize="medium" />
          </Button>
        )}
        {currentStatus !== 'rejected' && (
          <Button 
            variant="contained" 
            size="medium"
            color="error"
            sx={{ 
              minWidth: 40,
              height: 40,
              p: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(invoice, 'rejected');
            }}
          >
            <Cancel fontSize="medium" />
          </Button>
        )}
        {currentStatus !== 'paid' && (
          <Button 
            variant="contained" 
            size="medium"
            color="info"
            sx={{ 
              minWidth: 40,
              height: 40,
              p: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateStatus(invoice, 'paid');
            }}
          >
            <Paid fontSize="medium" />
          </Button>
        )}
      </Box>
    );
  };
  
  return (
    <TableContainer 
      sx={{ 
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        },
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            '& th': { fontWeight: 'bold' }
          }}>
            <TableCell width="50px" />
            <TableCell>
              <TableSortLabel
                active={sort.field === 'invoiceNumber'}
                direction={sort.field === 'invoiceNumber' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('invoiceNumber')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Assignment sx={{ mr: 1, fontSize: 18 }} />
                  Invoice Number
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.field === 'vendorName'}
                direction={sort.field === 'vendorName' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('vendorName')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1, fontSize: 18 }} />
                  Vendor
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.field === 'amount'}
                direction={sort.field === 'amount' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('amount')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachMoney sx={{ mr: 1, fontSize: 18 }} />
                  Amount
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.field === 'status'}
                direction={sort.field === 'status' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('status')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterAlt sx={{ mr: 1, fontSize: 18 }} />
                  Status
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell align="center" sx={{ minWidth: 160 }}>
              Actions
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.field === 'dueDate'}
                direction={sort.field === 'dueDate' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('dueDate')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday sx={{ mr: 1, fontSize: 18 }} />
                  Due Date
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.field === 'createdAt'}
                direction={sort.field === 'createdAt' ? sort.direction : 'asc'}
                onClick={() => handleSortChange('createdAt')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Schedule sx={{ mr: 1, fontSize: 18 }} />
                  Created
                </Box>
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">More</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((invoice, index) => {
            const statusInfo = getStatusInfo(invoice.status || 'pending');
            const isLastElement = index === invoices.length - 1;
            
            return (
              <React.Fragment key={`invoice-row-${invoice._id}`}>
                <TableRow
                  ref={isLastElement && hasMore ? lastInvoiceElementRef : null}
                  sx={{ 
                    '& > *': { borderBottom: 'unset' },
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.04)' 
                    },
                    backgroundColor: expandedRow === invoice._id 
                      ? (theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.02)')
                      : 'transparent'
                  }}
                  onClick={() => handleRowExpand(invoice._id)}
                >
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowExpand(invoice._id);
                      }}
                    >
                      {expandedRow === invoice._id ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.vendorName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(invoice.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={invoice.status ? (invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)) : 'Pending'}
                        color={statusInfo.color}
                        size="small"
                        icon={statusInfo.icon}
                        sx={{ 
                          borderRadius: '4px',
                          '& .MuiChip-icon': { ml: 0.5 }
                        }}
                      />
                      
                      {/* Add Status Actions Directly Below Status - Only for admin, NOT for reviewers */}
                      {user?.role === 'admin' && (
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          ml: 1
                        }}>
                          {invoice.status !== 'approved' && (
                            <Button 
                              variant="contained" 
                              size="small"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(invoice, 'approved');
                              }}
                              sx={{ minWidth: 32, height: 28, p: 0 }}
                            >
                              <CheckCircle fontSize="small" />
                            </Button>
                          )}
                          {invoice.status !== 'rejected' && (
                            <Button 
                              variant="contained" 
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(invoice, 'rejected');
                              }}
                              sx={{ minWidth: 32, height: 28, p: 0 }}
                            >
                              <Cancel fontSize="small" />
                            </Button>
                          )}
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 160 }}>
                    {(user?.role === 'admin' || user?.role === 'reviewer') && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        {renderStatusActions(invoice)}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.dueDate && format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.createdAt && format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {invoice.status === 'pending' && (user?.role === 'admin' || (user?.role === 'user' && invoice.createdBy === user.id)) && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            sx={{ mr: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditDrawer(invoice);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {user?.role === 'admin' && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvoice(invoice);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow key={`invoice-details-${invoice._id}`}>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRow === invoice._id} timeout="auto" unmountOnExit>
                      <Box sx={{ 
                        p: 3, 
                        my: 1,
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.01)',
                        borderLeft: '4px solid',
                        borderColor: theme.palette[statusInfo.color].main || theme.palette.primary.main
                      }}>
                        <InvoiceDetailContent 
                          invoice={invoice} 
                          statusInfo={statusInfo} 
                          formatCurrency={formatCurrency}
                          handleUpdateStatus={handleUpdateStatus}
                          handleOpenEditDrawer={handleOpenEditDrawer}
                          user={user}
                        />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const InvoiceList = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { invoices = [], total = 0 } = useSelector((state) => state.invoices);
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  // Parse query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const statusFromUrl = queryParams.get('status') || '';

  // State for infinite scrolling and data handling
  const [allInvoices, setAllInvoices] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: statusFromUrl,
    date: '',
  });
  const [sort, setSort] = useState({
    field: 'createdAt',
    direction: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [editDrawer, setEditDrawer] = useState({
    open: false,
    invoice: null,
  });
  // New form state for edit drawer
  const [editForm, setEditForm] = useState({
    invoiceNumber: '',
    vendorName: '',
    amount: '',
    dueDate: '',
    description: '',
  });
  
  // Track what fields have been modified
  const [modifiedFields, setModifiedFields] = useState({});
  
  const limit = 10;

  // Store hasMore in a ref to access latest value in the observer callback
  const hasMoreRef = useRef(hasMore);
  
  // Update the ref when hasMore changes
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  
  // Refs for infinite scrolling
  const observer = useRef();
  const lastInvoiceElementRef = useCallback(
    node => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && hasMoreRef.current) {
          setPage(prevPage => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading]
  );

  // Data fetching - now for infinite scrolling
  useEffect(() => {
    const fetchInvoicesFromOrganization = async () => {
      try {
        setLoading(true);
        
        // Get organization ID, either from user object or by fetching user data
        let organizationId = user?.organization;
        
        // If no organization ID is available in the user object, fetch it
        if (!organizationId) {
          const userDataResult = await databaseService.getData(`users/${user.uid}`);
          if (!userDataResult.success || !userDataResult.data?.organization) {
            throw new Error('Unable to determine user organization');
          }
          
          // Store organization ID in local variable instead of modifying user object
          organizationId = userDataResult.data.organization;
        }
        
        console.log("Fetching invoices for organization:", organizationId);
        
        // Fetch invoices from the organization path
        const invoicesResult = await databaseService.getData(`organizations/${organizationId}/invoices`);
        
        if (!invoicesResult.success) {
          const errorMsg = invoicesResult.error?.message || JSON.stringify(invoicesResult.error) || 'Failed to fetch invoices';
          throw new Error(errorMsg);
        }
        
        let allInvoicesFromOrg = [];
        
        if (invoicesResult.data) {
          // Convert object to array with _id field
          allInvoicesFromOrg = Object.entries(invoicesResult.data).map(([id, data]) => ({
            _id: id,
            ...data
          }));
          
          // Apply sorting if specified
          if (sort?.field) {
            allInvoicesFromOrg.sort((a, b) => {
              if (sort.direction === 'asc') {
                return a[sort.field] > b[sort.field] ? 1 : -1;
              } else {
                return a[sort.field] < b[sort.field] ? 1 : -1;
              }
            });
          }
          
          // Apply filtering
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            allInvoicesFromOrg = allInvoicesFromOrg.filter(invoice => 
              invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
              invoice.vendorName?.toLowerCase().includes(searchLower) ||
              invoice.description?.toLowerCase().includes(searchLower)
            );
          }
          
          if (filters.status) {
            allInvoicesFromOrg = allInvoicesFromOrg.filter(invoice => invoice.status === filters.status);
          }
          
          // Handle pagination for client-side
          const startIndex = (page - 1) * limit;
          const paginatedInvoices = allInvoicesFromOrg.slice(startIndex, startIndex + limit);
          
          // Update state
          setAllInvoices(paginatedInvoices);
          setHasMore(startIndex + limit < allInvoicesFromOrg.length);
          console.log("Invoices loaded successfully:", paginatedInvoices.length, "of", allInvoicesFromOrg.length);
        } else {
          setAllInvoices([]);
          setHasMore(false);
          console.log("No invoices found for organization");
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setAllInvoices([]);
        setHasMore(false);
        // Show user-friendly error with snackbar
        handleOpenSnackbar(error.message || 'Failed to fetch invoices', 'error');
      } finally {
        setLoading(false);
      }
    };
  
    // Only fetch if user is logged in
    if (user?.uid) {
      fetchInvoicesFromOrganization();
    }
  }, [dispatch, page, sort, filters, limit, user]);

  // Update URL when status filter changes
  useEffect(() => {
    if (filters.status) {
      navigate(`/invoices?status=${filters.status}`, { replace: true });
    } else if (statusFromUrl) {
      navigate('/invoices', { replace: true });
    }
  }, [filters.status, navigate, statusFromUrl]);

  // Reset page and clear all invoices when filters or sort change
  useEffect(() => {
    setPage(1);
    setAllInvoices([]);
    setHasMore(true);
  }, [filters, sort]);

  // Handle search input change with debounce
  const searchTimeoutRef = useRef(null);
  const handleSearchChange = (e) => {
    const value = e.target.value;
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a timeout to update the filters after typing stops
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 500); // 500ms debounce
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // If status is "all", set it to empty string to show all invoices
    const newValue = name === 'status' && value === 'all' ? '' : value;
    setFilters({ ...filters, [name]: newValue });
  };

  // Handle sort change
  const handleSortChange = (field) => {
    const isAsc = sort.field === field && sort.direction === 'asc';
    setSort({
      field,
      direction: isAsc ? 'desc' : 'asc',
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      date: '',
    });
    navigate('/invoices', { replace: true });
  };

  // Handle row expansion toggle
  const handleRowExpand = (invoiceId) => {
    setExpandedRow(expandedRow === invoiceId ? null : invoiceId);
  };

  // Confirm dialog handlers
  const handleOpenConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  // Snackbar handlers
  const handleOpenSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Edit drawer handlers
  const handleOpenEditDrawer = (invoice) => {
    setEditDrawer({
      open: true,
      invoice,
    });
  };

  const handleCloseEditDrawer = () => {
    setEditDrawer({
      ...editDrawer,
      open: false,
    });
  };

  // Function to handle edit form changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
    
    // Track that this field was modified
    setModifiedFields({
      ...modifiedFields,
      [name]: true,
    });
  };

  // Populate edit form when an invoice is selected
  useEffect(() => {
    if (editDrawer.invoice) {
      setEditForm({
        invoiceNumber: editDrawer.invoice.invoiceNumber || '',
        vendorName: editDrawer.invoice.vendorName || '',
        amount: editDrawer.invoice.amount || '',
        dueDate: editDrawer.invoice.dueDate ? new Date(editDrawer.invoice.dueDate).toISOString().split('T')[0] : '',
        description: editDrawer.invoice.description || '',
      });
      setModifiedFields({});
    }
  }, [editDrawer.invoice]);
  
  // Reset form when drawer closes
  useEffect(() => {
    if (!editDrawer.open) {
      setEditForm({
        invoiceNumber: '',
        vendorName: '',
        amount: '',
        dueDate: '',
        description: '',
      });
      setModifiedFields({});
    }
  }, [editDrawer.open]);

  // Get appropriate chip color based on status
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'warning',
          icon: <PendingActions fontSize="small" />,
        };
      case 'approved':
        return {
          color: 'success',
          icon: <CheckCircle fontSize="small" />,
        };
      case 'rejected':
        return {
          color: 'error',
          icon: <Cancel fontSize="small" />,
        };
      case 'paid':
        return {
          color: 'info',
          icon: <Paid fontSize="small" />,
        };
      case 'overdue':
        return {
          color: 'error',
          icon: <Alarm fontSize="small" />,
        };
      default:
        return {
          color: 'default',
          icon: null,
        };
    }
  };

  // Format currency amount
  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  };

  // Function to handle deletion with confirmation
  const handleDeleteInvoice = (invoice) => {
    handleOpenConfirmDialog(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`,
      async () => {
        try {
          await dispatch(deleteInvoice({ invoiceId: invoice._id })).unwrap();
          handleOpenSnackbar('Invoice deleted successfully');
          
          // Reset the list to refresh data
          setPage(1);
          setAllInvoices([]);
          setHasMore(true);
        } catch (err) {
          handleOpenSnackbar(err.message || 'Failed to delete invoice', 'error');
        }
      }
    );
  };

  // Function to update invoice status
  const handleUpdateStatus = (invoice, newStatus) => {
    console.log("Update status called:", invoice._id, "New status:", newStatus);
    console.log("User role:", user?.role); // Debug log user role
    
    handleOpenConfirmDialog(
      'Update Status',
      `Are you sure you want to update the status of invoice ${invoice.invoiceNumber} to ${newStatus}?`,
      async () => {
        try {
          console.log("Confirming status update to:", newStatus);
          
          // First, update the invoice in the current state to avoid blank screen
          const updatedInvoice = {...invoice, status: newStatus};
          const updatedInvoices = allInvoices.map(inv => 
            inv._id === invoice._id ? updatedInvoice : inv
          );
          setAllInvoices(updatedInvoices);
          
          // Then dispatch the update to the server
          await dispatch(updateInvoiceStatus({ 
            invoiceId: invoice._id, 
            status: newStatus 
          })).unwrap();
          
          // Success notification
          handleOpenSnackbar(`Invoice status updated to ${newStatus}`);
          
          // In background, refresh data without clearing existing data first
          fetchInvoicesInBackground();
          
          // Close the expanded row if it was open
          if (expandedRow === invoice._id) {
            setExpandedRow(null);
          }
        } catch (err) {
          console.error('Error updating invoice status:', err);
          handleOpenSnackbar(err.message || 'Failed to update invoice status', 'error');
          
          // If error, revert the optimistic update
          fetchInvoicesInBackground();
        }
      }
    );
  };

  // Add a function to fetch invoices in background without clearing current data
  const fetchInvoicesInBackground = async () => {
    try {
      let organizationId = user?.organization;
      
      if (!organizationId) {
        const userDataResult = await databaseService.getData(`users/${user.uid}`);
        if (!userDataResult.success || !userDataResult.data?.organization) {
          throw new Error('Unable to determine user organization');
        }
        organizationId = userDataResult.data.organization;
      }
      
      const invoicesResult = await databaseService.getData(`organizations/${organizationId}/invoices`);
      
      if (!invoicesResult.success) {
        const errorMsg = invoicesResult.error?.message || JSON.stringify(invoicesResult.error) || 'Failed to fetch invoices';
        throw new Error(errorMsg);
      }
      
      if (invoicesResult.data) {
        // Convert object to array with _id field
        let allInvoicesFromOrg = Object.entries(invoicesResult.data).map(([id, data]) => ({
          _id: id,
          ...data
        }));
        
        // Apply sorting if specified
        if (sort?.field) {
          allInvoicesFromOrg.sort((a, b) => {
            if (sort.direction === 'asc') {
              return a[sort.field] > b[sort.field] ? 1 : -1;
            } else {
              return a[sort.field] < b[sort.field] ? 1 : -1;
            }
          });
        }
        
        // Apply filtering
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          allInvoicesFromOrg = allInvoicesFromOrg.filter(invoice => 
            invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
            invoice.vendorName?.toLowerCase().includes(searchLower) ||
            invoice.description?.toLowerCase().includes(searchLower)
          );
        }
        
        if (filters.status) {
          allInvoicesFromOrg = allInvoicesFromOrg.filter(invoice => invoice.status === filters.status);
        }
        
        // Handle pagination for client-side
        const startIndex = (page - 1) * limit;
        const paginatedInvoices = allInvoicesFromOrg.slice(startIndex, startIndex + limit);
        
        // Update state without clearing first
        setAllInvoices(paginatedInvoices);
        setHasMore(startIndex + limit < allInvoicesFromOrg.length);
      }
    } catch (error) {
      console.error('Error fetching invoices in background:', error);
    }
  };
  
  // Function to submit edit form
  const handleSubmitEdit = () => {
    // Create object with only the modified fields
    const updates = {};
    Object.keys(modifiedFields).forEach(field => {
      updates[field] = editForm[field];
    });
    
    if (Object.keys(updates).length === 0) {
      handleOpenSnackbar('No changes detected', 'info');
      return;
    }
    
    handleOpenConfirmDialog(
      'Confirm Changes',
      `Are you sure you want to update invoice ${editForm.invoiceNumber}?`,
      async () => {
        try {
          await dispatch(updateInvoice({ 
            id: editDrawer.invoice._id, 
            invoiceData: updates 
          })).unwrap();
          
          handleOpenSnackbar('Invoice updated successfully');
          handleCloseEditDrawer();
          
          // Reset the list to refresh data
          setPage(1);
          setAllInvoices([]);
          setHasMore(true);
        } catch (err) {
          handleOpenSnackbar(err.message || 'Failed to update invoice', 'error');
        }
      }
    );
  };

  return (
    <Box>
      {/* Header Section */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <Box
          component={CardContent}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            pb: '16px !important',
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Invoices
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              Showing invoices for your organization only. {user?.role === 'reviewer' ? 'You can review any invoice from your organization.' : 'You can manage and track all your invoices here.'}
            </Typography>
          </Box>
          {/* Only show Create Invoice button for non-reviewer roles */}
          {user?.role !== 'reviewer' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              component={RouterLink}
              to="/invoices/create"
              sx={{ 
                borderRadius: '8px',
                px: 3,
                py: 1,
                boxShadow: theme.shadows[3],
                '&:hover': { boxShadow: theme.shadows[8] },
              }}
            >
              Create Invoice
            </Button>
          )}
        </Box>
      </Card>

      {/* Filters Section */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: theme.shadows[2] }}>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Field */}
            <TextField
              placeholder="Search invoices..."
              value={filters.search}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{ 
                minWidth: 250,
                maxWidth: 400,
                flexGrow: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                    <Cancel />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {/* Status Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 180,
              bgcolor: 'background.paper',
              borderRadius: 1
            }}
          >
            <Select
              value={filters.status}
              onChange={handleFilterChange}
              name="status"
              displayEmpty
              renderValue={(selected) => {
                if (selected === 'all') {
                  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList />
                    <Typography>All Statuses</Typography>
                  </Box>;
                }
                return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusInfo(selected).icon}
                  <Typography sx={{ textTransform: 'capitalize' }}>{selected}</Typography>
                </Box>;
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    width: 200
                  }
                }
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterList />
                  <Typography>All Statuses</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="pending">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingActions />
                  <Typography>Pending</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="approved">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle />
                  <Typography>Approved</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="rejected">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Cancel />
                  <Typography>Rejected</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="paid">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Paid />
                  <Typography>Paid</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="overdue">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Alarm />
                  <Typography>Overdue</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          {/* Reset Filters Button */}
          {(filters.search || filters.status || filters.date) && (
            <Button
              variant="outlined"
              size="small"
              color="primary"
              onClick={handleResetFilters}
              startIcon={<RestartAlt />}
              sx={{ borderRadius: 1 }}
            >
              Reset Filters
            </Button>
          )}
          </Box>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {loading && page === 1 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading invoices...
          </Typography>
        </Card>
      ) : (!allInvoices || allInvoices.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card sx={{ 
            p: 5, 
            textAlign: 'center', 
            borderRadius: 2,
            boxShadow: theme.shadows[2],
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.01)'
          }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2, color: 'text.secondary' }}>
              📋
            </Typography>
            <Typography variant="h5" gutterBottom fontWeight="medium">
              No invoices found yet! 😢
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {filters.search || filters.status || filters.date ? 
                "No invoices match your current filters. Try adjusting your search criteria." : 
                user?.role === 'reviewer' ? 
                  "There are no invoices in your organization to review at the moment." : 
                  "Get started by creating your first invoice!"
              }
            </Typography>
            {!filters.search && !filters.status && !filters.date && user?.role !== 'reviewer' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                component={RouterLink}
                to="/invoices/create"
                sx={{ 
                  mt: 2,
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  boxShadow: theme.shadows[3],
                  '&:hover': { boxShadow: theme.shadows[8] },
                }}
              >
                Create Your First Invoice
              </Button>
            )}
          </Card>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card sx={{ 
              borderRadius: 2,
              boxShadow: theme.shadows[2],
              overflow: 'hidden',
            }}>
              {isMobile ? (
                // Mobile view with swipeable list
                <MobileInvoiceList
                  invoices={allInvoices}
                  lastInvoiceElementRef={lastInvoiceElementRef}
                  expandedRow={expandedRow}
                  handleRowExpand={handleRowExpand}
                  formatCurrency={formatCurrency}
                  getStatusInfo={getStatusInfo}
                  handleDeleteInvoice={handleDeleteInvoice}
                  handleOpenEditDrawer={handleOpenEditDrawer}
                  handleUpdateStatus={handleUpdateStatus}
                  user={user}
                />
              ) : (
                // Desktop view with table
                <DesktopInvoiceList
                  invoices={allInvoices}
                  loading={loading}
                  hasMore={hasMore}
                  lastInvoiceElementRef={lastInvoiceElementRef}
                  handleRowExpand={handleRowExpand}
                  expandedRow={expandedRow}
                  formatCurrency={formatCurrency}
                  getStatusInfo={getStatusInfo}
                  handleDeleteInvoice={handleDeleteInvoice}
                  handleOpenEditDrawer={handleOpenEditDrawer}
                  handleUpdateStatus={handleUpdateStatus}
                  sort={sort}
                  handleSortChange={handleSortChange}
                  user={user}
                />
              )}
              
              {/* Loading indicator for infinite scroll */}
              {loading && page > 1 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Loading more invoices...
                  </Typography>
                </Box>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxWidth: 'sm',
            width: '100%',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              handleCloseConfirmDialog();
            }} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 1 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[3]
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Edit Invoice Drawer */}
      <SwipeableDrawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={editDrawer.open}
        onClose={handleCloseEditDrawer}
        onOpen={() => {}}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : '500px',
            height: isMobile ? '90%' : '100%',
            borderTopLeftRadius: isMobile ? '16px' : 0,
            borderTopRightRadius: isMobile ? '16px' : 0,
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" component="div" gutterBottom sx={{ mb: 3 }}>
            Edit Invoice: {editForm.invoiceNumber}
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                name="invoiceNumber"
                value={editForm.invoiceNumber}
                onChange={handleEditFormChange}
                variant="outlined"
                InputProps={{
                  readOnly: true, // Invoice number shouldn't be editable
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="vendorName"
                value={editForm.vendorName}
                onChange={handleEditFormChange}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                value={editForm.amount}
                onChange={handleEditFormChange}
                variant="outlined"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                value={editForm.dueDate}
                onChange={handleEditFormChange}
                variant="outlined"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editForm.description}
                onChange={handleEditFormChange}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button onClick={handleCloseEditDrawer} color="inherit" sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSubmitEdit}
              disabled={Object.keys(modifiedFields).length === 0}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
};

export default InvoiceList; 