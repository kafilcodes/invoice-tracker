import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import realtimeDb from '../../firebase/realtimeDatabase';
import { uploadFile } from '../../firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Upload invoice attachment
export const uploadInvoiceAttachment = createAsyncThunk(
  'invoices/uploadAttachment',
  async ({ file, invoiceId, organizationId }, { rejectWithValue }) => {
    try {
      if (!file || !invoiceId || !organizationId) {
        return rejectWithValue('Missing required parameters');
      }
      
      const filePath = `organizations/${organizationId}/invoices/${invoiceId}/attachments/${file.name}`;
      const fileUrl = await uploadFile(
        file,
        filePath,
        (progress) => console.log(`Upload progress: ${progress}%`)
      );
      
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
        path: filePath,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upload attachment');
    }
  }
);

// Get all invoices for a specific organization
export const getInvoices = createAsyncThunk(
  'invoices/getAll',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      console.log(`Fetching invoices for organization: ${orgId}`);
      
      const queryResult = await realtimeDb.getData(`organizations/${orgId}/invoices`);
      
      if (!queryResult.success) {
        return rejectWithValue(queryResult.error || 'Failed to fetch invoices');
      }
      
      // Convert Firebase object to array
      let invoices = [];
      if (queryResult.data) {
        invoices = Object.keys(queryResult.data).map(key => ({
          _id: key,
          ...queryResult.data[key]
        }));
        
        // Apply sorting if specified
        if (params?.sortField) {
          const { sortField, sortDirection } = params;
          invoices.sort((a, b) => {
            if (sortDirection === 'asc') {
              return a[sortField] > b[sortField] ? 1 : -1;
            } else {
              return a[sortField] < b[sortField] ? 1 : -1;
            }
          });
        } else {
          // Default sort by createdAt (newest first)
          invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        // Apply filtering if provided
        if (params?.search) {
          const searchLower = params.search.toLowerCase();
          invoices = invoices.filter(invoice => 
            invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
            invoice.vendorName?.toLowerCase().includes(searchLower) ||
            invoice.description?.toLowerCase().includes(searchLower)
          );
        }
        
        if (params?.status) {
          invoices = invoices.filter(invoice => invoice.status === params.status);
        }
        
        if (params?.date) {
          const [year, month] = params.date.split('-');
          invoices = invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate.getFullYear() === Number(year) && 
                   invoiceDate.getMonth() + 1 === Number(month);
          });
        }
      }
      
      // Handle pagination
      const total = invoices.length;
      if (params?.page && params?.limit) {
        const page = parseInt(params.page);
        const limit = parseInt(params.limit);
        const startIndex = (page - 1) * limit;
        invoices = invoices.slice(startIndex, startIndex + limit);
      }
      
      return { invoices, total };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return rejectWithValue(error.message || 'Failed to fetch invoices');
    }
  }
);

// Get a single invoice by ID
export const getInvoiceById = createAsyncThunk(
  'invoices/getById',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      
      const invoiceResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${id}`);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        return rejectWithValue('Invoice not found');
      }
      
      return { _id: id, ...invoiceResult.data };
    } catch (error) {
      console.error(`Error getting invoice ${id}:`, error);
      return rejectWithValue(error.message || 'Failed to fetch invoice');
    }
  }
);

// Create a new invoice
export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (invoiceData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      
      // Extract organization name from user data
      const organizationName = user?.organization;
      
      if (!organizationName) {
        console.error('Invoice creation failed: No organization associated with user');
        return rejectWithValue('No organization associated with user');
      }
      
      // Preserve original organization name from user profile
      const orgId = organizationName;
      
      console.log(`Creating invoice for organization: "${orgId}"`);
      
      // Test database permissions before attempting to write
      const permissionTest = await realtimeDb.testDatabasePermissions(`organizations/${orgId}/invoices`);
      
      if (!permissionTest.success) {
        console.error(`Permission denied for organizations/${orgId}/invoices - Cannot create invoice`);
        return rejectWithValue(`Database write permission denied: ${permissionTest.error || 'Access denied'}`);
      }
      
      // Process file attachments if any
      let attachments = [];
      if (invoiceData.attachments && invoiceData.attachments.length > 0) {
        for (const file of invoiceData.attachments) {
          try {
            console.log(`Uploading attachment: ${file.name}`);
            const fileUrl = await uploadFile(
              file, 
              `organizations/${orgId}/invoices/attachments`,
              (progress) => console.log(`Upload progress: ${progress}%`)
            );
            
            attachments.push({
              name: file.name,
              type: file.type,
              size: file.size,
              url: fileUrl,
              uploadedAt: new Date().toISOString(),
            });
            console.log(`Successfully uploaded attachment: ${file.name}`);
          } catch (error) {
            console.error(`File upload error for ${file.name}:`, error);
            // Continue with other files if one fails
          }
        }
      }
      
      // Create the invoice data with timestamps
      const timestamp = new Date().toISOString();
      const newInvoice = {
        ...invoiceData,
        attachments,
        organizationId: orgId,
        createdBy: {
          id: user.uid,
          name: user.displayName || user.name || user.email
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'pending',
        activity: [
          {
            action: 'Invoice created',
            userId: user.uid,
            timestamp,
            note: ''
          }
        ]
      };
      
      // Remove any non-serializable values from the invoice object
      const serializedInvoice = JSON.parse(JSON.stringify(newInvoice));
      
      console.log(`Attempting to create invoice in database for organization "${orgId}"`, serializedInvoice);
      
      // Save the invoice to Realtime Database
      const result = await realtimeDb.createInvoice(orgId, serializedInvoice);
      
      if (!result.success) {
        console.error(`Invoice creation failed in database for organization "${orgId}":`, result.error);
        return rejectWithValue(result.error || 'Failed to create invoice');
      }
      
      console.log(`Invoice created successfully with ID: ${result.data.id}`, result.data);
      
      // Add a direct check to verify the invoice was actually created
      const verifyResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${result.data.id}`);
      
      if (!verifyResult.success || !verifyResult.data) {
        console.error(`Invoice verification failed - Created invoice not found in database`);
        return rejectWithValue('Invoice creation appeared successful but verification failed');
      }
      
      console.log(`Invoice verification successful - Invoice exists in database`);
      
      // Log the activity
      try {
        await realtimeDb.logActivity(orgId, {
          type: 'invoice_created',
          userId: user.uid,
          invoiceId: result.data.id,
          timestamp
        });
        console.log(`Activity logged for invoice creation`);
      } catch (activityError) {
        console.error('Failed to log activity, but invoice was created:', activityError);
        // Don't fail the operation if just the activity logging fails
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return rejectWithValue(error.message || 'Failed to create invoice');
    }
  }
);

// Update an existing invoice
export const updateInvoice = createAsyncThunk(
  'invoices/update',
  async ({ id, invoiceData }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      
      // Get current invoice to merge with updates
      const currentInvoiceResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${id}`);
      
      if (!currentInvoiceResult.success || !currentInvoiceResult.data) {
        return rejectWithValue('Invoice not found');
      }
      
      const currentInvoice = currentInvoiceResult.data;
      
      // Process new file attachments if any
      const existingAttachments = currentInvoice.attachments || [];
      let updatedAttachments = [...existingAttachments];
      
      if (invoiceData.attachments && invoiceData.attachments.length > 0) {
        for (const file of invoiceData.attachments) {
          try {
            const fileUrl = await uploadFile(
              file, 
              `organizations/${orgId}/invoices/attachments`,
              (progress) => console.log(`Upload progress: ${progress}%`)
            );
            
            updatedAttachments.push({
              name: file.name,
              type: file.type,
              size: file.size,
              url: fileUrl,
              uploadedAt: new Date().toISOString(),
            });
          } catch (error) {
            console.error('File upload error:', error);
          }
        }
      }
      
      // Prepare updated invoice data
      const timestamp = new Date().toISOString();
      const updatedInvoice = {
        ...currentInvoice,
        ...invoiceData,
        attachments: updatedAttachments,
        updatedAt: timestamp,
        updatedBy: user.uid,
      };
      
      // Remove the file objects to avoid circular references
      delete updatedInvoice.attachmentFiles;
      
      // Save to database
      const result = await realtimeDb.updateData(
        `organizations/${orgId}/invoices/${id}`, 
        updatedInvoice
      );
      
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to update invoice');
      }
      
      // Log activity
      await dispatch(logInvoiceActivity({
        invoiceId: id,
        action: 'updated',
        details: `Invoice #${updatedInvoice.invoiceNumber} updated`
      }));
      
      return { _id: id, ...updatedInvoice };
    } catch (error) {
      console.error(`Error updating invoice ${id}:`, error);
      return rejectWithValue(error.message || 'Failed to update invoice');
    }
  }
);

// Update invoice status
export const updateInvoiceStatus = createAsyncThunk(
  'invoices/updateStatus',
  async ({ invoiceId, status, note }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      
      // Get current invoice
      const currentInvoiceResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${invoiceId}`);
      
      if (!currentInvoiceResult.success || !currentInvoiceResult.data) {
        return rejectWithValue('Invoice not found');
      }
      
      const currentInvoice = currentInvoiceResult.data;
      const timestamp = new Date().toISOString();
      
      // Prepare status update
      const statusUpdate = {
        status: status,
        statusChangedAt: timestamp,
        statusChangedBy: user.uid,
        statusNote: note || '',
        updatedAt: timestamp
      };
      
      // Save status update
      const result = await realtimeDb.updateData(
        `organizations/${orgId}/invoices/${invoiceId}`, 
        statusUpdate
      );
      
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to update status');
      }
      
      // Log activity
      await dispatch(logInvoiceActivity({
        invoiceId: invoiceId,
        action: 'status-changed',
        details: `Invoice #${currentInvoice.invoiceNumber} status changed to ${status}`
      }));
      
      return { 
        _id: invoiceId, 
        ...currentInvoice, 
        ...statusUpdate 
      };
    } catch (error) {
      console.error(`Error updating invoice status ${invoiceId}:`, error);
      return rejectWithValue(error.message || 'Failed to update invoice status');
    }
  }
);

// Delete an invoice
export const deleteInvoice = createAsyncThunk(
  'invoices/delete',
  async ({ invoiceId, organizationId }, { getState, rejectWithValue, dispatch }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      
      if (!organizationId) {
        const organizationName = user?.organization;
        if (!organizationName) {
          return rejectWithValue('No organization associated with user');
        }
        organizationId = organizationName;
      }
      
      // Get invoice details before deletion
      const invoiceResult = await realtimeDb.getData(`organizations/${organizationId}/invoices/${invoiceId}`);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        return rejectWithValue('Invoice not found');
      }
      
      const invoice = invoiceResult.data;
      
      // Delete invoice from database
      const result = await realtimeDb.deleteData(`organizations/${organizationId}/invoices/${invoiceId}`);
      
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to delete invoice');
      }
      
      // Log activity
      await dispatch(logInvoiceActivity({
        invoiceId,
        action: 'deleted',
        details: `Invoice #${invoice.invoiceNumber} deleted`
      }));
      
      return { id: invoiceId };
    } catch (error) {
      console.error(`Error deleting invoice ${invoiceId}:`, error);
      return rejectWithValue(error.message || 'Failed to delete invoice');
    }
  }
);

// Log invoice activity
export const logInvoiceActivity = createAsyncThunk(
  'invoices/logActivity',
  async ({ invoiceId, action, details }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      
      // Create activity log entry
      const activityId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const activityData = {
        invoiceId,
        action,
        details,
        performedBy: {
          uid: user.uid,
          name: user.displayName || user.name || user.email,
        },
        timestamp
      };
      
      // Save activity log
      const result = await realtimeDb.setData(
        `organizations/${orgId}/activity/${activityId}`, 
        activityData
      );
      
      if (!result.success) {
        console.error('Failed to log activity:', result.error);
        return rejectWithValue('Failed to log activity');
      }
      
      return activityData;
    } catch (error) {
      console.error('Error logging activity:', error);
      return rejectWithValue(error.message || 'Failed to log activity');
    }
  }
);

// Get organization users (for reviewer assignment)
export const getOrganizationUsers = createAsyncThunk(
  'invoices/getOrganizationUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      // Query users with the same organization name
      const usersResult = await realtimeDb.queryData(
        'users', 
        'organization', 
        organizationName
      );
      
      if (!usersResult.success) {
        return rejectWithValue(usersResult.error || 'Failed to fetch users');
      }
      
      // Convert to array if not already
      const users = Array.isArray(usersResult.data) 
        ? usersResult.data 
        : Object.values(usersResult.data || {});
      
      return users;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch organization users');
    }
  }
);

// Get recent activity
export const getRecentActivity = createAsyncThunk(
  'invoices/getRecentActivity',
  async (limit = 20, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      const organizationName = user?.organization;
      
      if (!organizationName) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = organizationName;
      
      // Get activity logs
      const activityResult = await realtimeDb.getData(`organizations/${orgId}/activity`);
      
      if (!activityResult.success) {
        return rejectWithValue(activityResult.error || 'Failed to fetch activity');
      }
      
      // Convert to array and sort by timestamp (newest first)
      let activity = [];
      if (activityResult.data) {
        activity = Object.keys(activityResult.data).map(key => ({
          _id: key,
          ...activityResult.data[key]
        }));
        
        activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limit results
        activity = activity.slice(0, limit);
      }
      
      return activity;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch activity');
    }
  }
);

const initialState = {
  invoices: [],
  currentInvoice: null,
  organizationUsers: [],
  total: 0,
  loading: false,
  error: null,
  success: false,
  activity: [],
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    resetInvoiceState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all invoices
      .addCase(getInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.total = action.payload.total;
        state.success = true;
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get invoice by ID
      .addCase(getInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
        state.success = true;
      })
      .addCase(getInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
        // Add to list if available
        if (state.invoices) {
          state.invoices.unshift(action.payload);
          state.total += 1;
        }
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update invoice
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
        
        // Update in list if available
        if (state.invoices) {
          const index = state.invoices.findIndex(
            (invoice) => invoice._id === action.payload._id
          );
          if (index !== -1) {
            state.invoices[index] = action.payload;
          }
        }
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update invoice status
      .addCase(updateInvoiceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
        
        // Update in list if available
        if (state.invoices) {
          const index = state.invoices.findIndex(
            (invoice) => invoice._id === action.payload._id
          );
          if (index !== -1) {
            state.invoices[index] = action.payload;
          }
        }
      })
      .addCase(updateInvoiceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Delete invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        
        // Remove from list if available
        if (state.invoices) {
          state.invoices = state.invoices.filter(
            (invoice) => invoice._id !== action.payload.id
          );
          state.total -= 1;
        }
        
        // Clear current invoice if it's the one that was deleted
        if (state.currentInvoice && state.currentInvoice._id === action.payload.id) {
          state.currentInvoice = null;
        }
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Get organization users
      .addCase(getOrganizationUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrganizationUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.organizationUsers = action.payload;
      })
      .addCase(getOrganizationUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get recent activity
      .addCase(getRecentActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecentActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activity = action.payload;
      })
      .addCase(getRecentActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetInvoiceState, clearCurrentInvoice } = invoiceSlice.actions;
export default invoiceSlice.reducer; 