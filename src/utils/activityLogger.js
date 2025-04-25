import { ref, push, query, orderByChild, equalTo, get, limitToLast } from 'firebase/database';
import { rtdb } from '../firebase/config';

// Activity types
export const ACTIVITY_TYPES = {
  INVOICE_CREATED: 'Invoice created',
  INVOICE_UPDATED: 'Invoice updated',
  INVOICE_DELETED: 'Invoice deleted',
  COMMENT_ADDED: 'Comment added',
  INVOICE_REVIEWED: 'Invoice reviewed',
  STATUS_CHANGED: 'Status changed',
  ATTACHMENT_ADDED: 'Attachment added',
  ATTACHMENT_REMOVED: 'Attachment removed',
  USER_ASSIGNED: 'User assigned'
};

/**
 * Log a user activity
 * @param {Object} activityData - Activity data
 * @param {string} activityData.type - Activity type (e.g., 'Invoice created', 'Invoice updated', etc.)
 * @param {string} activityData.userId - User ID who performed the action
 * @param {string} activityData.organizationId - Organization ID
 * @param {string} activityData.targetId - ID of the target resource (e.g., invoice ID)
 * @param {string} activityData.targetType - Type of the target resource (e.g., 'invoice')
 * @param {Object} activityData.details - Additional details about the activity
 * @returns {Promise<string>} - Activity log ID
 */
export const logActivity = async (activityData) => {
  try {
    const { type, userId, organizationId, targetId, targetType, details } = activityData;
    
    const activityObj = {
      type,
      userId,
      organizationId,
      targetId,
      targetType,
      details: details || {},
      timestamp: new Date().toISOString()
    };
    
    const activityRef = ref(rtdb, `organizations/${organizationId}/activity`);
    const newActivityRef = push(activityRef);
    await push(activityRef, activityObj);
    
    return newActivityRef.key;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw the error to prevent it from affecting the main operation
    return null;
  }
};

/**
 * Get activity logs for an organization
 * @param {string} organizationId - Organization ID
 * @param {Object} options - Query options
 * @param {string} options.targetId - Filter by target ID (optional)
 * @param {string} options.targetType - Filter by target type (optional)
 * @param {string} options.userId - Filter by user ID (optional)
 * @param {number} options.limit - Maximum number of logs to return (default: 50)
 * @returns {Promise<Array>} - Activity logs
 */
export const getActivityLogs = async (organizationId, options = {}) => {
  try {
    const { targetId, targetType, userId, limit: queryLimit = 50 } = options;
    
    // Start with the basic reference
    const activityRef = ref(rtdb, `organizations/${organizationId}/activity`);
    
    // Get all activities
    const snapshot = await get(activityRef);
    if (!snapshot.exists()) {
      return [];
    }
    
    // Convert to array
    let logs = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      logs.push({
        id: childSnapshot.key,
        ...data
      });
    });
    
    // Apply filters
    if (targetId) {
      logs = logs.filter(log => log.targetId === targetId);
    }
    
    if (targetType) {
      logs = logs.filter(log => log.targetType === targetType);
    }
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    if (queryLimit && logs.length > queryLimit) {
      logs = logs.slice(0, queryLimit);
    }
    
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

/**
 * Get recent activity for a specific invoice
 * @param {string} organizationId - Organization ID
 * @param {string} invoiceId - Invoice ID
 * @param {number} limit - Maximum number of logs to return (default: 10)
 * @returns {Promise<Array>} - Activity logs
 */
export const getInvoiceActivity = async (organizationId, invoiceId, limit = 10) => {
  return getActivityLogs(organizationId, {
    targetId: invoiceId,
    targetType: 'invoice',
    limit
  });
};

/**
 * Get recent activity by a specific user
 * @param {string} organizationId - Organization ID
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of logs to return (default: 10)
 * @returns {Promise<Array>} - Activity logs
 */
export const getUserActivity = async (organizationId, userId, limit = 10) => {
  return getActivityLogs(organizationId, {
    userId,
    limit
  });
};

/**
 * Action type constants
 */
export const ActivityActions = {
  CREATE_INVOICE: 'create_invoice',
  UPDATE_INVOICE: 'update_invoice',
  DELETE_INVOICE: 'delete_invoice',
  REVIEW_INVOICE: 'review_invoice',
  APPROVE_INVOICE: 'approve_invoice',
  REJECT_INVOICE: 'reject_invoice',
  UPLOAD_ATTACHMENT: 'upload_attachment',
  DELETE_ATTACHMENT: 'delete_attachment',
  ADD_COMMENT: 'add_comment',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout'
}; 