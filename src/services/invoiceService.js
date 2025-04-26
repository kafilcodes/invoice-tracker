import invoiceRealtimeService from './InvoiceRealtimeService';
import { uploadMultipleFiles, deleteFile } from '../utils/fileUpload';

/**
 * Create a new invoice in RTDB
 * @param {Object} invoiceData - The invoice data
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID of the creator
 * @param {Array} files - Files to attach to the invoice
 * @returns {Promise<Object>} - Created invoice data with ID
 */
export const createInvoice = async (invoiceData, orgId, userId, files = []) => {
  try {
    console.log(`Creating invoice for organization: ${orgId}`, { invoiceData });
    
    // Prepare the invoice object
    const timestamp = new Date().toISOString();
    const invoiceObj = {
      ...invoiceData,
      organizationId: orgId,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'pending',
      attachments: [],
      reviewers: invoiceData.reviewers || [],
      customFields: invoiceData.customFields || {},
      notes: invoiceData.notes || '',
    };

    // If there are files, upload them
    if (files && files.length > 0) {
      console.log(`Uploading ${files.length} files for invoice`);
      const uploadResults = await uploadMultipleFiles(files, orgId, 'pending-invoice');
      
      // Update the invoice with attachment info
      if (uploadResults.totalUploaded > 0) {
        invoiceObj.attachments = uploadResults.results
          .filter(result => !result.error)
          .map(file => ({
            name: file.name,
            url: file.fileURL,
            size: file.size,
            type: file.type,
            path: file.path,
            uploadedAt: file.uploadedAt
          }));
      }
    }

    // Create the invoice in Realtime Database
    const result = await invoiceRealtimeService.createInvoice(orgId, invoiceObj);
    
    if (!result.success) {
      console.error(`Failed to create invoice in RTDB:`, result.error);
      throw new Error(result.error || 'Failed to create invoice');
    }
    
    console.log(`Invoice created successfully with ID: ${result.data.id}`);
    
    // Log activity
    await invoiceRealtimeService.logActivity(orgId, {
      type: 'invoice_created',
      userId,
      invoiceId: result.data.id,
      timestamp,
      details: {
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount
      }
    });
    
    return result.data;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

/**
 * Get invoice by ID from RTDB
 * @param {string} invoiceId - Invoice ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object>} - Invoice data
 */
export const getInvoiceById = async (invoiceId, orgId) => {
  try {
    console.log(`Getting invoice ${invoiceId} from organization ${orgId}`);
    const result = await invoiceRealtimeService.getInvoice(orgId, invoiceId);
    
    if (!result.success || !result.data) {
      throw new Error('Invoice not found');
    }
    
    return { id: invoiceId, ...result.data };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

/**
 * Get all invoices for an organization from RTDB
 * @param {string} orgId - Organization ID
 * @param {Object} options - Query options (status, limit, etc.)
 * @returns {Promise<Array>} - Array of invoice data
 */
export const getOrganizationInvoices = async (orgId, options = {}) => {
  try {
    console.log(`Getting invoices for organization ${orgId}`, options);
    const result = await invoiceRealtimeService.getOrganizationInvoices(orgId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch invoices');
    }
    
    if (!result.data) {
      return [];
    }
    
    // Convert object to array
    let invoices = Object.entries(result.data).map(([id, data]) => ({
      id,
      ...data
    }));
    
    // Apply filters if specified
    if (options.status) {
      invoices = invoices.filter(invoice => invoice.status === options.status);
    }
    
    if (options.createdBy) {
      invoices = invoices.filter(invoice => 
        invoice.createdBy === options.createdBy || 
        invoice.createdBy?.id === options.createdBy
      );
    }
    
    if (options.reviewer) {
      invoices = invoices.filter(invoice => 
        invoice.reviewers?.includes(options.reviewer)
      );
    }
    
    // Sort by createdAt (newest first)
    invoices.sort((a, b) => 
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    
    // Apply limit if specified
    if (options.limit) {
      invoices = invoices.slice(0, options.limit);
    }
    
    return invoices;
  } catch (error) {
    console.error('Error fetching organization invoices:', error);
    throw error;
  }
};

/**
 * Update an invoice in RTDB
 * @param {string} invoiceId - Invoice ID
 * @param {string} orgId - Organization ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID making the update
 * @param {Array} newFiles - New files to add (optional)
 * @returns {Promise<Object>} - Updated invoice data
 */
export const updateInvoice = async (invoiceId, orgId, updateData, userId, newFiles = []) => {
  try {
    console.log(`Updating invoice ${invoiceId} for organization ${orgId}`);
    
    // Get current invoice
    const currentResult = await invoiceRealtimeService.getInvoice(orgId, invoiceId);
    
    if (!currentResult.success || !currentResult.data) {
      throw new Error('Invoice not found');
    }
    
    const currentInvoice = currentResult.data;
    
    // Process new files if any
    let attachments = currentInvoice.attachments || [];
    
    if (newFiles && newFiles.length > 0) {
      console.log(`Uploading ${newFiles.length} new files for invoice update`);
      const uploadResults = await uploadMultipleFiles(newFiles, orgId, invoiceId);
      
      if (uploadResults.totalUploaded > 0) {
        const newAttachments = uploadResults.results
          .filter(result => !result.error)
          .map(file => ({
            name: file.name,
            url: file.fileURL,
            size: file.size,
            type: file.type,
            path: file.path,
            uploadedAt: new Date().toISOString()
          }));
        
        attachments = [...attachments, ...newAttachments];
      }
    }
    
    // Prepare update object
    const timestamp = new Date().toISOString();
    const updates = {
      ...updateData,
      attachments,
      updatedAt: timestamp,
      updatedBy: userId
    };
    
    // Update in RTDB
    const result = await invoiceRealtimeService.updateInvoice(orgId, invoiceId, updates);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update invoice');
    }
    
    // Log activity
    await invoiceRealtimeService.logActivity(orgId, {
      type: 'invoice_updated',
      userId,
      invoiceId,
      timestamp,
      details: getChanges(currentInvoice, updateData)
    });
    
    return { id: invoiceId, ...currentInvoice, ...updates };
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

/**
 * Update invoice status in RTDB
 * @param {string} invoiceId - Invoice ID 
 * @param {string} orgId - Organization ID
 * @param {string} newStatus - New status value
 * @param {string} userId - User ID making the update
 * @param {string} comment - Optional comment for the status change
 * @returns {Promise<Object>} - Updated invoice data
 */
export const updateInvoiceStatus = async (invoiceId, orgId, newStatus, userId, comment = '') => {
  try {
    console.log(`Updating invoice ${invoiceId} status to ${newStatus}`);
    
    // Get current invoice
    const currentResult = await invoiceRealtimeService.getInvoice(orgId, invoiceId);
    
    if (!currentResult.success || !currentResult.data) {
      throw new Error('Invoice not found');
    }
    
    const currentInvoice = currentResult.data;
    const timestamp = new Date().toISOString();
    
    // Prepare status update
    const updates = {
      status: newStatus,
      statusChangedAt: timestamp,
      statusChangedBy: userId,
      statusNote: comment,
      updatedAt: timestamp,
      updatedBy: userId
    };
    
    // Update in RTDB
    const result = await invoiceRealtimeService.updateInvoice(orgId, invoiceId, updates);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update invoice status');
    }
    
    // Log activity
    await invoiceRealtimeService.logActivity(orgId, {
      type: 'invoice_status_changed',
      userId,
      invoiceId,
      timestamp,
      details: {
        previousStatus: currentInvoice.status,
        newStatus,
        comment
      }
    });
    
    return { id: invoiceId, ...currentInvoice, ...updates };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};

/**
 * Delete an invoice from RTDB
 * @param {string} invoiceId - Invoice ID
 * @param {string} orgId - Organization ID
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} - Result of deletion
 */
export const deleteInvoice = async (invoiceId, orgId, userId) => {
  try {
    console.log(`Deleting invoice ${invoiceId} from organization ${orgId}`);
    
    // Get invoice details before deletion
    const invoiceResult = await invoiceRealtimeService.getInvoice(orgId, invoiceId);
    
    if (!invoiceResult.success || !invoiceResult.data) {
      throw new Error('Invoice not found');
    }
    
    const invoice = invoiceResult.data;
    
    // Delete any attached files
    if (invoice.attachments && invoice.attachments.length > 0) {
      console.log(`Deleting ${invoice.attachments.length} attachments`);
      for (const attachment of invoice.attachments) {
        if (attachment.path) {
          try {
            await deleteFile(attachment.path);
          } catch (fileError) {
            console.error(`Failed to delete attachment ${attachment.name}:`, fileError);
            // Continue with other files
          }
        }
      }
    }
    
    // Delete invoice from RTDB
    const result = await invoiceRealtimeService.deleteInvoice(orgId, invoiceId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete invoice');
    }
    
    // Log activity
    await invoiceRealtimeService.logActivity(orgId, {
      type: 'invoice_deleted',
      userId,
      invoiceId,
      timestamp: new Date().toISOString(),
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount
      }
    });
    
    return { success: true, id: invoiceId };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

/**
 * Delete attachment from an invoice
 * @param {string} invoiceId - Invoice ID
 * @param {string} orgId - Organization ID
 * @param {string} attachmentPath - Storage path of the attachment
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} - Updated invoice
 */
export const deleteInvoiceAttachment = async (invoiceId, orgId, attachmentPath, userId) => {
  try {
    console.log(`Deleting attachment from invoice ${invoiceId}`);
    
    // Get current invoice
    const currentResult = await invoiceRealtimeService.getInvoice(orgId, invoiceId);
    
    if (!currentResult.success || !currentResult.data) {
      throw new Error('Invoice not found');
    }
    
    const currentInvoice = currentResult.data;
    
    // Find the attachment
    const attachments = currentInvoice.attachments || [];
    const attachmentIndex = attachments.findIndex(att => att.path === attachmentPath);
    
    if (attachmentIndex === -1) {
      throw new Error('Attachment not found');
    }
    
    const attachment = attachments[attachmentIndex];
    
    // Delete the file
    try {
      await deleteFile(attachmentPath);
    } catch (fileError) {
      console.error(`Failed to delete attachment file:`, fileError);
      // Continue even if file deletion fails
    }
    
    // Update the attachments array
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(attachmentIndex, 1);
    
    // Update invoice in RTDB
    const timestamp = new Date().toISOString();
    const updates = {
      attachments: updatedAttachments,
      updatedAt: timestamp,
      updatedBy: userId
    };
    
    const result = await invoiceRealtimeService.updateInvoice(orgId, invoiceId, updates);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update invoice attachments');
    }
    
    // Log activity
    await invoiceRealtimeService.logActivity(orgId, {
      type: 'invoice_attachment_deleted',
      userId,
      invoiceId,
      timestamp,
      details: {
        attachmentName: attachment.name
      }
    });
    
    return { id: invoiceId, ...currentInvoice, ...updates };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};

/**
 * Helper to get changes between objects
 * @param {Object} oldData - Original data
 * @param {Object} newData - New data
 * @returns {Object} - Changes
 */
const getChanges = (oldData, newData) => {
  const changes = {};
  
  Object.keys(newData).forEach(key => {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = {
        from: oldData[key],
        to: newData[key]
      };
    }
  });
  
  return changes;
}; 