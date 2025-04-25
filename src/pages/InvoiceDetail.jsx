import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container, 
  CircularProgress, 
  Divider, 
  Grid, 
  IconButton, 
  Paper, 
  Typography, 
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Stack, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Tab, 
  Tabs, 
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AttachFile as AttachmentIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { getInvoiceById, updateInvoiceStatus, deleteInvoice } from '../redux/slices/invoiceSlice';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// PDF document styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    width: 120,
    fontWeight: 'bold'
  },
  value: {
    flex: 1
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    marginBottom: 20
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    borderBottomStyle: 'solid'
  },
  tableCell: {
    flex: 1,
    padding: 5
  },
  tableCellHeader: {
    fontWeight: 'bold',
    backgroundColor: '#F5F5F5'
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666'
  },
  logo: {
    width: 100,
    height: 'auto'
  }
});

// PDF Document component
const InvoicePDF = ({ invoice, organization }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text>{invoice.invoiceNumber}</Text>
        </View>
        {organization?.logo && (
          <Image
            src={organization.logo}
            style={styles.logo}
          />
        )}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FROM</Text>
        <Text>{organization?.name || 'Your Organization'}</Text>
        <Text>{organization?.address || ''}</Text>
        <Text>{organization?.email || ''}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TO</Text>
        <Text>{invoice.vendorName}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice Number:</Text>
          <Text style={styles.value}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Issue Date:</Text>
          <Text style={styles.value}>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due Date:</Text>
          <Text style={styles.value}>{invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{invoice.category}</Text>
        </View>
      </View>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableCellHeader]}>
          <Text style={styles.tableCell}>Description</Text>
          <Text style={styles.tableCell}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>{invoice.description || 'Service/Product'}</Text>
          <Text style={styles.tableCell}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: invoice.currency || 'USD'
            }).format(invoice.amount)}
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.value}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: invoice.currency || 'USD'
            }).format(invoice.amount)}
          </Text>
        </View>
      </View>
      
      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text>Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
        <Text>Invoice Tracker - {organization?.name || 'Your Organization'}</Text>
      </View>
    </Page>
  </Document>
);

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { invoice, loading } = useSelector(state => state.invoices);
  const { user, organization } = useSelector(state => state.auth);
  const { users } = useSelector(state => state.users);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [pdfReady, setPdfReady] = useState(false);
  
  // Fetch invoice on component mount
  useEffect(() => {
    if (id && organization?.id) {
      dispatch(getInvoiceById({ 
        organizationId: organization.id,
        invoiceId: id
      }));
    }
  }, [dispatch, id, organization]);
  
  // Set PDF ready after invoice loads
  useEffect(() => {
    if (invoice && !loading) {
      setPdfReady(true);
    }
  }, [invoice, loading]);
  
  // Handle tab change
  const handleChangeTab = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  // Handle opening delete dialog
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle confirming delete
  const handleConfirmDelete = async () => {
    try {
      await dispatch(deleteInvoice({ 
        organizationId: organization?.id,
        invoiceId: id 
      })).unwrap();
      
      handleCloseDeleteDialog();
      navigate('/invoices');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };
  
  // Handle opening status change dialog
  const handleOpenStatusDialog = (status) => {
    setNewStatus(status);
    setStatusNote('');
    setStatusDialogOpen(true);
  };
  
  // Handle closing status dialog
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
  };
  
  // Handle confirming status change
  const handleConfirmStatusChange = async () => {
    try {
      await dispatch(updateInvoiceStatus({ 
        organizationId: organization.id,
        invoiceId: id,
        status: newStatus,
        note: statusNote,
        updatedBy: user.uid
      })).unwrap();
      
      handleCloseStatusDialog();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };
  
  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Format timestamp with time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  // Get user name by ID
  const getUserName = (userId) => {
    const user = users?.find(user => user._id === userId);
    return user ? (user.name || user.email) : 'Unknown User';
  };
  
  // Determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon />;
      case 'rejected':
        return <CancelIcon />;
      case 'pending':
        return <DescriptionIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading invoice details...
        </Typography>
      </Container>
    );
  }
  
  if (!invoice) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Invoice not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
          sx={{ mt: 2 }}
        >
          Back to Invoices
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <Box>
        <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/invoices')}
          sx={{ mb: 2 }}
        >
          Back to Invoices
        </Button>
            
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Invoice #{invoice.invoiceNumber}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                icon={getStatusIcon(invoice.status)}
                label={invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                color={getStatusColor(invoice.status)}
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Created on {formatDate(invoice.createdAt)} by {getUserName(invoice.createdBy?.id)}
          </Typography>
        </Box>
      </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {user?.role === 'admin' && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/invoices/${id}/edit`)}
                >
                  Edit
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleOpenDeleteDialog}
                >
                  Delete
                </Button>
              </>
            )}
            
            {pdfReady && (
              <PDFDownloadLink
                document={<InvoicePDF invoice={invoice} organization={organization} />}
                fileName={`Invoice_${invoice.invoiceNumber}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ blob, url, loading, error }) => (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudDownloadIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </Box>
        </Box>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleChangeTab}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Invoice Details" />
            <Tab label="Activity History" />
            <Tab label="Attachments" />
          </Tabs>
          
          {/* Invoice Details Tab */}
          <TabPanel value={currentTab} index={0}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
                <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Invoice Information
              </Typography>
                    
              <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Invoice Number
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {invoice.invoiceNumber}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vendor
                  </Typography>
                        <Typography variant="body1" gutterBottom>
                          {invoice.vendorName}
                  </Typography>
                </Grid>
                      
                      <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                        <Typography variant="body1" gutterBottom fontWeight="bold">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {invoice.category}
                  </Typography>
                </Grid>
                      
                      <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                          Issue Date
                  </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(invoice.issueDate)}
                  </Typography>
                </Grid>
                      
                      <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Due Date
                  </Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatDate(invoice.dueDate)}
                  </Typography>
                </Grid>
                      
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                          Organization Remark
                  </Typography>
                        <Typography variant="body1" gutterBottom>
                          {invoice.organizationRemark || 'No remark provided'}
                  </Typography>
                </Grid>
                      
                      {invoice.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                            Notes
                  </Typography>
                          <Paper 
                            variant="outlined" 
                            sx={{ p: 2, bgcolor: 'background.default', mt: 1 }}
                          >
                            <Typography variant="body2">
                              {invoice.notes}
                  </Typography>
                          </Paper>
                </Grid>
                      )}

                      {invoice.customFields && invoice.customFields.length > 0 && (
                  <Grid item xs={12}>
                          <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                            Custom Fields
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <Grid container spacing={2}>
                            {invoice.customFields.map((field, index) => (
                              <Grid item xs={12} md={6} key={index}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  {field.name}
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                  {field.value}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Card variant="outlined">
            <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                        Status Actions
              </Typography>
                      
                      {invoice.status === 'pending' && (
                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            fullWidth
                            onClick={() => handleOpenStatusDialog('approved')}
                          >
                            Approve Invoice
                          </Button>
                          
                  <Button
                    variant="contained"
                            color="error"
                            startIcon={<CancelIcon />}
                    fullWidth
                            onClick={() => handleOpenStatusDialog('rejected')}
                  >
                            Reject Invoice
                  </Button>
                        </Stack>
                      )}
                      
                      {invoice.status === 'approved' && (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          This invoice has been approved.
                        </Alert>
                      )}
                      
                      {invoice.status === 'rejected' && (
                        <Alert severity="error" icon={<CancelIcon />}>
                          This invoice has been rejected.
                        </Alert>
                      )}
            </CardContent>
          </Card>

                </Stack>
              </Grid>
            </Grid>
          </TabPanel>
          
          {/* Activity History Tab */}
          <TabPanel value={currentTab} index={1}>
            <Card variant="outlined">
            <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  Activity Timeline
                </Typography>
                
                {invoice.activity && invoice.activity.length > 0 ? (
                  <Timeline position="alternate">
                    {invoice.activity.map((activity, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="text.secondary">
                          {formatTimestamp(activity.timestamp)}
                        </TimelineOppositeContent>
                        
                        <TimelineSeparator>
                          <TimelineDot color={
                            activity.action.includes('approved') ? 'success' :
                            activity.action.includes('rejected') ? 'error' :
                            activity.action.includes('created') ? 'primary' :
                            'grey'
                          }>
                            {activity.action.includes('approved') ? <CheckCircleIcon /> :
                             activity.action.includes('rejected') ? <CancelIcon /> :
                             activity.action.includes('created') ? <ReceiptIcon /> :
                             activity.action.includes('edited') ? <EditIcon /> :
                             <HistoryIcon />}
                          </TimelineDot>
                          {index < invoice.activity.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        
                        <TimelineContent>
                          <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h6" component="span">
                              {activity.action}
                            </Typography>
                            <Typography>
                              By {getUserName(activity.userId)}
                            </Typography>
                            {activity.note && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Note: {activity.note}
                  </Typography>
                            )}
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <HistoryIcon color="disabled" sx={{ fontSize: 60, opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                      No activity recorded yet
                    </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          </TabPanel>

          {/* Attachments Tab */}
          <TabPanel value={currentTab} index={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                  Invoice Attachments
                </Typography>
                
                {invoice.attachments && invoice.attachments.length > 0 ? (
                  <Grid container spacing={2}>
                    {invoice.attachments.map((attachment, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <AttachmentIcon color="primary" sx={{ mr: 1 }} />
                              <Typography variant="subtitle1" noWrap>
                                {attachment.name}
                        </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Type: {attachment.type}
                      </Typography>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Size: {formatFileSize(attachment.size)}
                      </Typography>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Uploaded: {formatDate(attachment.uploadedAt)}
                        </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<DownloadIcon />}
                                fullWidth
                                component="a"
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </Button>
                    </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AttachmentIcon color="disabled" sx={{ fontSize: 60, opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                      No attachments available
                    </Typography>
                </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
        >
          <DialogTitle>Delete Invoice</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete invoice #{invoice.invoiceNumber}? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog
          open={statusDialogOpen}
          onClose={handleCloseStatusDialog}
          fullWidth
          maxWidth="sm"
        >
        <DialogTitle>
            {newStatus === 'approved' ? 'Approve Invoice' : 'Reject Invoice'}
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Are you sure you want to {newStatus === 'approved' ? 'approve' : 'reject'} invoice #{invoice.invoiceNumber}?
          </DialogContentText>
            
            <TextField
              autoFocus
              margin="dense"
              label="Add a note (optional)"
              fullWidth
              multiline
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              variant="outlined"
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmStatusChange}
              color={newStatus === 'approved' ? 'success' : 'error'} 
            variant="contained"
              startIcon={newStatus === 'approved' ? <CheckCircleIcon /> : <CancelIcon />}
          >
              {newStatus === 'approved' ? 'Approve' : 'Reject'} Invoice
          </Button>
        </DialogActions>
      </Dialog>
      </motion.div>
    </Container>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
};

export default InvoiceDetail; 