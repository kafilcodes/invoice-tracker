import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import realtimeDb from '../../firebase/realtimeDb';
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
  async (invoiceData, { getState, rejectWithValue, dispatch }) => {
    console.log('================================================');
    console.log('[STEP 1/8] 🚀 INVOICE CREATION STARTED', new Date().toISOString());
    console.log('================================================');
    
    try {
      const { auth } = getState();
      const { user } = auth;
      
      console.log('[STEP 1.1] 👤 User information:', { 
        userId: user?.uid, 
        userEmail: user?.email,
        userRole: user?.role,
        organization: user?.organization 
      });
      
      let organizationName = user?.organization;
      
      // If organization name is not in Redux state, try to get it directly from Firebase
      if (!organizationName && user?.uid) {
        console.log('[STEP 1.1.1] 🔍 Organization not found in Redux state, fetching from Firebase...');
        try {
          // Get user data directly from Firebase
          const userDataResult = await realtimeDb.getData(`users/${user.uid}`);
          
          if (userDataResult.success && userDataResult.data && userDataResult.data.organization) {
            organizationName = userDataResult.data.organization;
            console.log('[STEP 1.1.2] ✅ Organization fetched from Firebase:', organizationName);
          } else {
            console.log('[STEP 1.1.3] ⚠️ Failed to get organization from Firebase:', userDataResult);
          }
        } catch (fetchError) {
          console.error('[STEP 1.1.4] ❌ Error fetching user data from Firebase:', fetchError);
        }
      }
      
      if (!organizationName) {
        // Fallback to hardcoded organization if user has admin role
        if (user?.role === 'admin') {
          organizationName = 'Google';  // Fallback for admin users
          console.log('[STEP 1.1.5] ⚠️ Using fallback organization for admin:', organizationName);
        } else {
          const errorMsg = 'No organization associated with user';
          console.error('[STEP 1.2] ❌ !!! FAILED !!! No organization found for user:', { user });
          return rejectWithValue(errorMsg);
        }
      }
      
      // Preserve original organization name from user profile
      const orgId = organizationName;
      
      console.log('[STEP 2/8] 📋 Organization confirmed:', { 
        organizationId: orgId, 
        userId: user.uid, 
        userName: user.displayName || user.email
      });
      
      // Detailed log of the invoice data we received
      console.log('[STEP 2.1] 📦 Complete invoice data:', JSON.stringify(invoiceData, null, 2));
      
      // Test database permissions before attempting to write
      console.log('[STEP 3/8] 🔒 Testing database permissions...');
      console.log('[STEP 3.1] 🔒 Testing path:', `organizations/${orgId}/invoices`);
      
      try {
        const permissionTest = await realtimeDb.testDatabasePermissions(`organizations/${orgId}/invoices`);
        
        if (!permissionTest.success) {
          const errorMsg = `Database write permission denied: ${permissionTest.error || 'Access denied'}`;
          console.error(`[STEP 3.2] ❌ !!! FAILED !!! Permission test failed:`, permissionTest);
          return rejectWithValue(errorMsg);
        }
        
        console.log('[STEP 3.3] ✅ Permission test passed');
      } catch (permError) {
        console.error(`[STEP 3.4] ❌ !!! FAILED !!! Permission test error:`, permError);
        return rejectWithValue(`Permission test error: ${permError.message}`);
      }
      
      // Create a unique ID for the invoice (needed before uploading files)
      const invoiceId = invoiceData.id || `inv-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      console.log(`[STEP 4/8] 🔑 Generated invoice ID: ${invoiceId}`);
      
      // Process file attachments if any
      let attachments = [];
      if (invoiceData.attachments && invoiceData.attachments.length > 0) {
        console.log(`[STEP 5/8] 📎 Processing ${invoiceData.attachments.length} attachments for upload`);
        
        // Log details of each attachment
        invoiceData.attachments.forEach((file, index) => {
          console.log(`[STEP 5.1] File ${index + 1} details:`, {
            name: file?.name,
            type: file?.type,
            size: file?.size,
            lastModified: file?.lastModified
          });
        });
        
        try {
          for (const file of invoiceData.attachments) {
            if (!file || !file.name) {
              console.warn('[STEP 5.2] ⚠️ Skipping invalid attachment:', file);
              continue;
            }
            
            try {
              console.log(`[STEP 5.3] 📤 Uploading attachment: ${file.name} (${file.size} bytes, type: ${file.type})`);
              
              // Construct proper path for the file in Storage
              const filePath = `organizations/${orgId}/invoices/${invoiceId}/attachments`;
              console.log(`[STEP 5.4] 📁 Storage path for file: ${filePath}`);
              
              // Store the file object for debugging
              const fileObjectSnapshot = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                isFile: file instanceof File,
                hasArrayBuffer: 'arrayBuffer' in file
              };
              console.log(`[STEP 5.5] 🔍 File object details:`, fileObjectSnapshot);
              
              // Show detailed progress in console
              let fileUrl;
              try {
                fileUrl = await uploadFile(
                  file, 
                  filePath,
                  (progress) => console.log(`[STEP 5.6] 📊 Upload progress for ${file.name}: ${progress.toFixed(1)}%`)
                );
                
                if (!fileUrl) {
                  console.error(`[STEP 5.7] ❌ !!! FAILED !!! No download URL returned for ${file.name}`);
                  throw new Error(`Failed to get download URL for ${file.name}`);
                }
                
                console.log(`[STEP 5.8] ✅ Upload successful for ${file.name}, URL: ${fileUrl}`);
              } catch (uploadError) {
                console.error(`[STEP 5.9] ❌ !!! FAILED !!! Upload error for ${file.name}:`, uploadError);
                throw uploadError;
              }
              
              // Add the file metadata to attachments array
              const fileMetadata = {
                name: file.name,
                type: file.type,
                size: file.size,
                url: fileUrl, 
                path: `${filePath}/${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
                uploadedAt: new Date().toISOString(),
              };
              
              attachments.push(fileMetadata);
              console.log(`[STEP 5.10] ✅ Attachment metadata added:`, fileMetadata);
            } catch (fileError) {
              console.error(`[STEP 5.11] ❌ File upload error for ${file.name}:`, fileError);
              console.error(`[STEP 5.12] Stack trace:`, fileError.stack);
              // Continue with other files if one fails
            }
          }
          
          console.log(`[STEP 5.13] 📎 Processed attachments summary: ${attachments.length} successfully uploaded`);
        } catch (attachmentError) {
          console.error('[STEP 5.14] ❌ Error processing attachments:', attachmentError);
          console.error('[STEP 5.15] Stack trace:', attachmentError.stack);
          // Continue with invoice creation even if attachments fail
        }
      } else {
        console.log('[STEP 5/8] ℹ️ No attachments to process');
      }
      
      // Create the invoice data with timestamps and ID
      const timestamp = new Date().toISOString();
      const newInvoice = {
        ...invoiceData,
        id: invoiceId,
        attachments,
        organizationId: orgId,
        createdBy: {
          id: user.uid,
          name: user.displayName || user.name || user.email
        },
        createdAt: timestamp,
        updatedAt: timestamp,
        status: invoiceData.status || 'pending',
        activity: [
          {
            action: 'Invoice created',
            userId: user.uid,
            timestamp,
            note: ''
          }
        ]
      };
      
      // Remove non-serializable properties to avoid Firebase errors
      const serializedInvoice = JSON.parse(JSON.stringify(newInvoice));
      delete serializedInvoice.attachmentFiles;
      
      console.log(`[STEP 6/8] 🧾 Final invoice data prepared:`, serializedInvoice);
      console.log(`[STEP 6.1] 🔍 Target RTDB path: organizations/${orgId}/invoices/${invoiceId}`);
      
      // Save the invoice to Realtime Database with explicit path including the ID
      console.log(`[STEP 7/8] 💾 Saving invoice to database...`);
      let result;
      try {
        result = await realtimeDb.setData(
          `organizations/${orgId}/invoices/${invoiceId}`, 
          serializedInvoice
        );
        
        if (!result.success) {
          const errorMsg = result.error || 'Failed to create invoice';
          console.error(`[STEP 7.1] ❌ !!! FAILED !!! Database write failed:`, result);
          return rejectWithValue(errorMsg);
        }
        
        console.log(`[STEP 7.2] ✅ Database write succeeded`);
      } catch (dbError) {
        console.error(`[STEP 7.3] ❌ !!! FAILED !!! Database write error:`, dbError);
        console.error(`[STEP 7.4] Stack trace:`, dbError.stack);
        return rejectWithValue(`Database error: ${dbError.message}`);
      }
      
      // Add a direct check to verify the invoice was actually created
      console.log(`[STEP 7.5] 🔍 Verifying invoice was saved correctly...`);
      try {
        const verifyResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${invoiceId}`);
        
        if (!verifyResult.success || !verifyResult.data) {
          const errorMsg = 'Invoice creation appeared successful but verification failed';
          console.error(`[STEP 7.6] ❌ !!! FAILED !!! Verification failed:`, verifyResult);
          return rejectWithValue(errorMsg);
        }
        
        console.log(`[STEP 7.7] ✅ Invoice verified in database`, verifyResult.data);
      } catch (verifyError) {
        console.error(`[STEP 7.8] ❌ !!! FAILED !!! Verification error:`, verifyError);
        return rejectWithValue(`Verification error: ${verifyError.message}`);
      }
      
      // Log the activity
      try {
        console.log(`[STEP 7.9] 📝 Logging invoice creation activity...`);
        await realtimeDb.logActivity(orgId, {
          type: 'invoice_created',
          userId: user.uid,
          invoiceId: invoiceId,
          timestamp,
          details: {
            invoiceNumber: invoiceData.invoiceNumber || invoiceId,
            amount: invoiceData.amount || 0
          }
        });
        console.log(`[STEP 7.10] ✅ Activity logged successfully`);
      } catch (activityError) {
        console.error('[STEP 7.11] ⚠️ Activity logging failed, but invoice was created:', activityError);
        // Don't fail the operation if just the activity logging fails
      }
      
      console.log('================================================');
      console.log('[STEP 8/8] 🎉 INVOICE CREATION COMPLETED SUCCESSFULLY', new Date().toISOString());
      console.log('================================================');
      
      return { ...serializedInvoice, id: invoiceId };
    } catch (error) {
      console.error('[FATAL ERROR] ❌ !!! FAILED !!! Unhandled error in invoice creation:', error);
      console.error('[FATAL ERROR] Stack trace:', error.stack);
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
  async ({ invoiceId, status, note }, { dispatch, getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const { user } = auth;
      
      if (!user?.organization) {
        return rejectWithValue('No organization associated with user');
      }
      
      const orgId = user.organization;
      const userId = user.uid;
      
      // Get current invoice
      const invoiceResult = await realtimeDb.getData(`organizations/${orgId}/invoices/${invoiceId}`);
      
      if (!invoiceResult.success || !invoiceResult.data) {
        return rejectWithValue('Invoice not found');
      }
      
      const invoice = invoiceResult.data;
      const previousStatus = invoice.status;
      
      // Create status update
      const statusUpdate = {
        status,
        updatedAt: new Date().toISOString(),
        statusUpdatedBy: userId
      };
      
      // Add note if provided
      if (note && typeof note === 'string' && note.trim()) {
        statusUpdate.statusNote = note.trim();
      }
      
      // Update invoice in database
      const updateResult = await realtimeDb.updateData(
        `organizations/${orgId}/invoices/${invoiceId}`,
        statusUpdate
      );
      
      if (!updateResult.success) {
        return rejectWithValue('Failed to update invoice status');
      }
      
      // Get user information for activity logging
      const userDataResult = await realtimeDb.getData(`users/${userId}`);
      const userData = userDataResult.success ? userDataResult.data : null;
      
      // Log the activity to the organization's activity collection
      const activityData = {
        type: 'invoice_status_changed',
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        previousStatus,
        newStatus: status,
        timestamp: new Date().toISOString(),
        performedBy: {
          id: userId,
          name: userData?.name || userData?.displayName || 'Unknown User',
          email: userData?.email || 'unknown@example.com'
        }
      };
      
      // Only add note field if it exists and is not undefined
      if (note && typeof note === 'string' && note.trim()) {
        activityData.note = note.trim();
      }
      
      await realtimeDb.pushData(`organizations/${orgId}/activity`, activityData);
      
      // Return the updated invoice with all original data plus the updates
      return {
        _id: invoiceId,
        ...invoice,
        ...statusUpdate,
        previousStatus
      };
    } catch (error) {
      console.error('Error updating invoice status:', error);
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
        if (state.invoices && state.invoices.length > 0) {
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