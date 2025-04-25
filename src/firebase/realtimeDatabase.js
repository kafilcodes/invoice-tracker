import { ref, set, get, remove, update, child, push, onValue, off, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { rtdb } from './config';

/**
 * Firebase Realtime Database Service
 * Provides methods for interacting with the Firebase Realtime Database
 */
class RealtimeDatabaseService {
  constructor() {
    this.db = rtdb;
  }

  /**
   * Set data at a specific path in the database
   * @param {string} path - Database path
   * @param {object} data - Data to store
   * @param {boolean} timestamp - Whether to add timestamp to data
   * @returns {Promise} Promise resolving when data is set
   */
  async setData(path, data, timestamp = true) {
    try {
      const dbRef = ref(this.db, path);
      const dataToStore = timestamp 
        ? { 
            ...data, 
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } 
        : data;
      
      await set(dbRef, dataToStore);
      return { success: true, data: dataToStore };
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Push data to a collection path in the database (generates new key)
   * @param {string} path - Database collection path
   * @param {object} data - Data to store
   * @param {boolean} timestamp - Whether to add timestamp to data
   * @returns {Promise} Promise resolving to the generated key and data
   */
  async pushData(path, data, timestamp = true) {
    try {
      const collectionRef = ref(this.db, path);
      const newItemRef = push(collectionRef);
      
      const dataToStore = timestamp 
        ? { 
            ...data, 
            id: newItemRef.key,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString() 
          } 
        : { ...data, id: newItemRef.key };
      
      await set(newItemRef, dataToStore);
      return { success: true, key: newItemRef.key, data: dataToStore };
    } catch (error) {
      console.error(`Error pushing data to ${path}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Get data from a specific path in the database
   * @param {string} path - Database path
   * @returns {Promise} Promise resolving to the data
   */
  async getData(path) {
    try {
      const dbRef = ref(this.db, path);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Update data at a specific path in the database
   * @param {string} path - Database path
   * @param {object} data - Data to update (partial update)
   * @param {boolean} timestamp - Whether to add updatedAt timestamp
   * @returns {Promise} Promise resolving when data is updated
   */
  async updateData(path, data, timestamp = true) {
    try {
      const dbRef = ref(this.db, path);
      const updates = timestamp 
        ? { ...data, updatedAt: new Date().toISOString() } 
        : data;
      
      await update(dbRef, updates);
      return { success: true, data: updates };
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Remove data at a specific path in the database
   * @param {string} path - Database path
   * @returns {Promise} Promise resolving when data is removed
   */
  async removeData(path) {
    try {
      const dbRef = ref(this.db, path);
      await remove(dbRef);
      return { success: true };
    } catch (error) {
      console.error(`Error removing data at ${path}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Subscribe to data changes at a specific path
   * @param {string} path - Database path
   * @param {function} callback - Callback function receiving (data, error)
   * @returns {function} Unsubscribe function
   */
  subscribeToData(path, callback) {
    const dbRef = ref(this.db, path);
    
    const listener = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val(), null);
      } else {
        callback(null, null);
      }
    }, (error) => {
      console.error(`Error subscribing to ${path}:`, error);
      callback(null, error);
    });
    
    // Return unsubscribe function
    return () => off(dbRef, 'value', listener);
  }

  /**
   * Query data with specific criteria
   * @param {string} path - Database path
   * @param {string} orderBy - Field to order by
   * @param {any} equalToValue - Value to match (optional)
   * @param {number} limit - Maximum number of items to return (optional)
   * @returns {Promise} Promise resolving to the query results
   */
  async queryData(path, orderBy, equalToValue = null, limit = null) {
    try {
      let dbQuery = ref(this.db, path);
      
      if (orderBy) {
        dbQuery = query(dbQuery, orderByChild(orderBy));
        
        if (equalToValue !== null) {
          dbQuery = query(dbQuery, equalTo(equalToValue));
        }
        
        if (limit !== null) {
          dbQuery = query(dbQuery, limitToLast(limit));
        }
      }
      
      const snapshot = await get(dbQuery);
      
      if (snapshot.exists()) {
        const results = [];
        snapshot.forEach((childSnapshot) => {
          results.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return { success: true, data: results };
      } else {
        return { success: true, data: [] };
      }
    } catch (error) {
      console.error(`Error querying data at ${path}:`, error);
      return { success: false, error };
    }
  }

  // User Profile Methods

  /**
   * Create user profile in the Realtime Database
   * @param {string} uid - User ID
   * @param {object} profileData - User profile data
   * @returns {Promise} Promise resolving when profile is created
   */
  async createUserProfile(uid, profileData) {
    return this.setData(`users/${uid}`, {
      ...profileData,
      lastLogin: new Date().toISOString(),
    });
  }

  /**
   * Get user profile from the Realtime Database
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving to the user profile
   */
  async getUserProfile(uid) {
    return this.getData(`users/${uid}`);
  }

  /**
   * Update user profile in the Realtime Database
   * @param {string} uid - User ID
   * @param {object} updates - User profile updates
   * @returns {Promise} Promise resolving when profile is updated
   */
  async updateUserProfile(uid, updates) {
    return this.updateData(`users/${uid}`, updates);
  }

  /**
   * Update user's last login timestamp
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving when timestamp is updated
   */
  async updateLastLogin(uid) {
    return this.updateData(`users/${uid}`, {
      lastLogin: new Date().toISOString()
    });
  }

  // Notification Methods

  /**
   * Create a notification for a user
   * @param {string} uid - User ID
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {object} metadata - Additional metadata for the notification
   * @returns {Promise} Promise resolving when notification is created
   */
  async createNotification(uid, message, type = 'info', metadata = {}) {
    return this.pushData(`notifications/${uid}`, {
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Get all notifications for a user
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving to the user's notifications
   */
  async getNotifications(uid) {
    return this.getData(`notifications/${uid}`);
  }

  /**
   * Mark a notification as read
   * @param {string} uid - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Promise resolving when notification is marked as read
   */
  async markNotificationAsRead(uid, notificationId) {
    return this.updateData(`notifications/${uid}/${notificationId}`, {
      read: true
    });
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving when all notifications are marked as read
   */
  async markAllNotificationsAsRead(uid) {
    try {
      const result = await this.getNotifications(uid);
      
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'No notifications found' };
      }
      
      const notifications = result.data;
      const updates = {};
      
      Object.keys(notifications).forEach(notificationId => {
        updates[`notifications/${uid}/${notificationId}/read`] = true;
      });
      
      const dbRef = ref(this.db);
      await update(dbRef, updates);
      
      return { success: true };
    } catch (error) {
      console.error(`Error marking all notifications as read for ${uid}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Delete a notification
   * @param {string} uid - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise} Promise resolving when notification is deleted
   */
  async deleteNotification(uid, notificationId) {
    return this.removeData(`notifications/${uid}/${notificationId}`);
  }

  /**
   * Delete all notifications for a user
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving when all notifications are deleted
   */
  async deleteAllNotifications(uid) {
    return this.removeData(`notifications/${uid}`);
  }

  /**
   * Subscribe to notifications for a user
   * @param {string} uid - User ID
   * @param {function} callback - Callback function receiving (data, error)
   * @returns {function} Unsubscribe function
   */
  subscribeToNotifications(uid, callback) {
    return this.subscribeToData(`notifications/${uid}`, callback);
  }

  // Invoice Methods

  /**
   * Create an invoice in an organization
   * @param {string} organizationId - Organization ID/name
   * @param {object} invoiceData - Invoice data
   * @returns {Promise} Promise resolving to the created invoice
   */
  async createInvoice(organizationId, invoiceData) {
    try {
      // Ensure organizationId is valid
      if (!organizationId) {
        console.error('Invalid organization ID provided for invoice creation');
        return { success: false, error: 'Invalid organization ID' };
      }

      console.log(`Creating invoice in database for org: ${organizationId}`, invoiceData);
      
      // Use pushData to generate a unique ID and save the invoice
      // FIXED: Use organizations/ instead of org/ to match the database structure
      const result = await this.pushData(`organizations/${organizationId}/invoices`, invoiceData);
      
      if (!result.success) {
        console.error(`Failed to create invoice for ${organizationId}:`, result.error);
      } else {
        console.log(`Successfully created invoice with ID: ${result.key}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in createInvoice for ${organizationId}:`, error);
      return { success: false, error: error.message || 'Failed to create invoice' };
    }
  }

  /**
   * Get an invoice from an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise} Promise resolving to the invoice
   */
  async getInvoice(organizationId, invoiceId) {
    console.log(`Getting invoice ${invoiceId} from organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.getData(`organizations/${organizationId}/invoices/${invoiceId}`);
  }

  /**
   * Get all invoices for an organization
   * @param {string} organizationId - Organization ID/name
   * @returns {Promise} Promise resolving to all invoices
   */
  async getOrganizationInvoices(organizationId) {
    console.log(`Getting all invoices for organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.getData(`organizations/${organizationId}/invoices`);
  }

  /**
   * Get invoices for a specific creator in an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} creatorId - Creator's user ID
   * @returns {Promise} Promise resolving to the creator's invoices
   */
  async getInvoicesByCreator(organizationId, creatorId) {
    console.log(`Getting invoices by creator ${creatorId} for organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.queryData(`organizations/${organizationId}/invoices`, 'creatorId', creatorId);
  }

  /**
   * Update an invoice in an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} invoiceId - Invoice ID
   * @param {object} updates - Invoice updates
   * @returns {Promise} Promise resolving when invoice is updated
   */
  async updateInvoice(organizationId, invoiceId, updates) {
    console.log(`Updating invoice ${invoiceId} for organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.updateData(`organizations/${organizationId}/invoices/${invoiceId}`, updates);
  }

  /**
   * Delete an invoice from an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} invoiceId - Invoice ID
   * @returns {Promise} Promise resolving when invoice is deleted
   */
  async deleteInvoice(organizationId, invoiceId) {
    console.log(`Deleting invoice ${invoiceId} from organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.removeData(`organizations/${organizationId}/invoices/${invoiceId}`);
  }

  /**
   * Subscribe to invoices for an organization
   * @param {string} organizationId - Organization ID/name
   * @param {function} callback - Callback function receiving (data, error)
   * @returns {function} Unsubscribe function
   */
  subscribeToOrganizationInvoices(organizationId, callback) {
    console.log(`Subscribing to invoices for organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.subscribeToData(`organizations/${organizationId}/invoices`, callback);
  }

  /**
   * Subscribe to invoices for a specific creator in an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} creatorId - Creator's user ID
   * @param {function} callback - Callback function receiving (data, error)
   * @returns {function} Unsubscribe function
   */
  subscribeToCreatorInvoices(organizationId, creatorId, callback) {
    const handleData = (data, error) => {
      if (error) {
        callback(null, error);
        return;
      }
      
      if (!data) {
        callback([], null);
        return;
      }
      
      // Filter invoices by creator
      const invoices = Object.entries(data)
        .filter(([_, invoice]) => invoice.creatorId === creatorId)
        .map(([id, invoice]) => ({ id, ...invoice }));
      
      callback(invoices, null);
    };
    
    return this.subscribeToData(`organizations/${organizationId}/invoices`, handleData);
  }

  // Activity logs methods for organization-based structure
  /**
   * Log an activity for an organization
   * @param {string} organizationId - Organization ID/name
   * @param {object} activityData - Activity data
   * @returns {Promise} Promise resolving when activity is logged
   */
  async logActivity(organizationId, activityData) {
    console.log(`Logging activity for organization ${organizationId}`);
    // FIXED: Use organizations/ instead of org/
    return this.pushData(`organizations/${organizationId}/activity_logs`, {
      ...activityData,
      timestamp: activityData.timestamp || new Date().toISOString()
    });
  }

  /**
   * Get recent activity logs for an organization
   * @param {string} organizationId - Organization ID/name
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise} Promise resolving to the activity logs
   */
  async getOrganizationActivity(organizationId, limit = 20) {
    try {
      const response = await this.getData(`organizations/${organizationId}/activity_logs`);
      
      if (!response.success) {
        return response;
      }
      
      if (!response.data) {
        return { success: true, data: [] };
      }
      
      // Convert to array and sort by timestamp (newest first)
      const activityArray = Object.entries(response.data).map(([id, activity]) => ({
        id,
        ...activity
      })).sort((a, b) => 
        new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );
      
      // Limit the number of results
      const limitedActivity = activityArray.slice(0, limit);
      
      return { success: true, data: limitedActivity };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return { success: false, error };
    }
  }

  /**
   * Get activity logs for a specific user in an organization
   * @param {string} organizationId - Organization ID/name
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise} Promise resolving to the user's activity logs
   */
  async getUserActivity(organizationId, userId, limit = 20) {
    try {
      const response = await this.getData(`organizations/${organizationId}/activity_logs`);
      
      if (!response.success) {
        return response;
      }
      
      if (!response.data) {
        return { success: true, data: [] };
      }
      
      // Convert to array, filter by userId, and sort by timestamp (newest first)
      const activityArray = Object.entries(response.data)
        .map(([id, activity]) => ({
          id,
          ...activity
        }))
        .filter(activity => activity.userId === userId)
        .sort((a, b) => 
          new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
        );
      
      // Limit the number of results
      const limitedActivity = activityArray.slice(0, limit);
      
      return { success: true, data: limitedActivity };
    } catch (error) {
      console.error(`Error getting activity for user ${userId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Subscribe to activity logs for an organization
   * @param {string} organizationId - Organization ID/name
   * @param {function} callback - Callback function receiving (data, error)
   * @returns {function} Unsubscribe function
   */
  subscribeToOrganizationActivity(organizationId, callback) {
    return this.subscribeToData(`organizations/${organizationId}/activity_logs`, callback);
  }

  /**
   * Get all users for an organization
   * @param {string} organizationId - Organization ID/name
   * @returns {Promise} Promise resolving to all users in the organization
   */
  async getOrganizationUsers(organizationId) {
    try {
      // First get all users
      const response = await this.getData('users');
      
      if (!response.success || !response.data) {
        return response.success ? { success: true, data: [] } : response;
      }
      
      // Filter users by organization
      const orgUsers = Object.entries(response.data)
        .map(([id, user]) => ({
          id,
          ...user
        }))
        .filter(user => user.organization === organizationId);
      
      return { success: true, data: orgUsers };
    } catch (error) {
      console.error(`Error getting users for organization ${organizationId}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Get user profile with organization context
   * @param {string} uid - User ID
   * @returns {Promise} Promise resolving to the user profile with organization info
   */
  async getUserProfileWithOrganization(uid) {
    try {
      const userResponse = await this.getUserProfile(uid);
      
      if (!userResponse.success || !userResponse.data) {
        return userResponse;
      }
      
      const user = userResponse.data;
      const organizationId = user.organization;
      
      // If no organization, just return the user
      if (!organizationId) {
        return userResponse;
      }
      
      // Get organization info
      const orgResponse = await this.getData(`organizations/${organizationId}`);
      
      if (!orgResponse.success) {
        return userResponse; // Return just the user if org fetch fails
      }
      
      // Combine user and organization info
      return {
        success: true,
        data: {
          ...user,
          organizationDetails: orgResponse.data || null
        }
      };
    } catch (error) {
      console.error(`Error getting user profile with organization for ${uid}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Test writing permissions to verify RTDB access
   * @param {string} path - Database path to test
   * @returns {Promise} Promise resolving to the test result
   */
  async testDatabasePermissions(path) {
    try {
      console.log(`Testing write permissions for path: ${path}`);
      const testId = `test_${Date.now()}`;
      const testData = {
        _testPermission: true,
        timestamp: new Date().toISOString()
      };
      
      // Try to write test data
      const result = await this.setData(`${path}/${testId}`, testData);
      
      // Clean up test data if successful
      if (result.success) {
        await this.removeData(`${path}/${testId}`);
        console.log(`Test successful: Write permissions confirmed for ${path}`);
      } else {
        console.error(`Test failed: No write permissions for ${path}`, result.error);
      }
      
      return result;
    } catch (error) {
      console.error(`Permission test error for ${path}:`, error);
      return { success: false, error: error.message || 'Permission test failed' };
    }
  }
}

const realtimeDb = new RealtimeDatabaseService();
export default realtimeDb; 