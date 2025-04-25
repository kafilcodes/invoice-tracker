import { ref, set, get, update, remove, push, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { app } from './config';

// Initialize Realtime Database
const db = getDatabase(app);

/**
 * Firebase Realtime Database Service
 * Provides methods to interact with Firebase Realtime Database
 */
class DatabaseService {
  /**
   * Sets data at a specific path
   * @param {string} path - Database path (e.g., 'users/userId')
   * @param {Object} data - Data to set
   * @returns {Promise<Object>} Response with success status
   */
  async setData(path, data) {
    try {
      // Add timestamps
      const timestamp = new Date().toISOString();
      const dataWithTimestamp = {
        ...data,
        updatedAt: timestamp,
      };
      
      // If the path doesn't contain a specific ID, we assume it's a new item
      if (!path.includes('/') || path.endsWith('/')) {
        // Generate new ID using push
        const newRef = push(ref(db, path));
        await set(newRef, {
          ...dataWithTimestamp,
          id: newRef.key,
          createdAt: timestamp
        });
        
        return {
          success: true,
          data: {
            id: newRef.key,
            ...dataWithTimestamp
          }
        };
      } else {
        // Set data at specific path
        await set(ref(db, path), dataWithTimestamp);
        
        return {
          success: true,
          data: dataWithTimestamp
        };
      }
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Failed to set data at ${path}`
        }
      };
    }
  }

  /**
   * Gets data from a specific path
   * @param {string} path - Database path
   * @returns {Promise<Object>} Response with success status and data
   */
  async getData(path) {
    try {
      const snapshot = await get(ref(db, path));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          success: true,
          data
        };
      } else {
        return {
          success: false,
          error: {
            code: 'not-found',
            message: `No data found at ${path}`
          }
        };
      }
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Failed to get data from ${path}`
        }
      };
    }
  }

  /**
   * Gets all data from a path (collection)
   * @param {string} path - Database path
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Response with success status and data
   */
  async getCollection(path, options = {}) {
    try {
      let dataRef = ref(db, path);
      
      // Apply query constraints if provided
      if (options.orderBy || options.equalTo) {
        if (options.orderBy && options.equalTo) {
          dataRef = query(
            dataRef, 
            orderByChild(options.orderBy), 
            equalTo(options.equalTo)
          );
        } else if (options.orderBy) {
          dataRef = query(dataRef, orderByChild(options.orderBy));
        }
      }

      const snapshot = await get(dataRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert object to array
        const dataArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Apply client-side sorting if needed
        if (options.sortBy) {
          dataArray.sort((a, b) => {
            if (options.sortDirection === 'desc') {
              return a[options.sortBy] < b[options.sortBy] ? 1 : -1;
            }
            return a[options.sortBy] > b[options.sortBy] ? 1 : -1;
          });
        }
        
        // Apply client-side pagination if needed
        if (options.limit) {
          const start = options.startAt || 0;
          const end = start + options.limit;
          return {
            success: true,
            data: dataArray.slice(start, end),
            total: dataArray.length
          };
        }
        
        return {
          success: true,
          data: dataArray
        };
      } else {
        return {
          success: true,
          data: []
        };
      }
    } catch (error) {
      console.error(`Error getting collection from ${path}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Failed to get collection from ${path}`
        }
      };
    }
  }

  /**
   * Updates data at a specific path
   * @param {string} path - Database path
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Response with success status
   */
  async updateData(path, data) {
    try {
      // Add timestamp
      const timestamp = new Date().toISOString();
      const updates = {
        ...data,
        updatedAt: timestamp
      };
      
      await update(ref(db, path), updates);
      
      return {
        success: true,
        data: updates
      };
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Failed to update data at ${path}`
        }
      };
    }
  }

  /**
   * Removes data at a specific path
   * @param {string} path - Database path
   * @returns {Promise<Object>} Response with success status
   */
  async removeData(path) {
    try {
      await remove(ref(db, path));
      
      return {
        success: true,
        data: { path }
      };
    } catch (error) {
      console.error(`Error removing data at ${path}:`, error);
      return {
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Failed to remove data at ${path}`
        }
      };
    }
  }

  /**
   * Subscribe to data changes at a specific path
   * @param {string} path - Database path
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToData(path, callback) {
    const dataRef = ref(db, path);
    
    const onDataChange = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({
          success: true,
          data: snapshot.val()
        });
      } else {
        callback({
          success: false,
          error: {
            code: 'not-found',
            message: `No data found at ${path}`
          }
        });
      }
    }, (error) => {
      callback({
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Error subscribing to ${path}`
        }
      });
    });
    
    // Return unsubscribe function
    return () => off(dataRef, 'value', onDataChange);
  }

  /**
   * Subscribe to a collection of data
   * @param {string} path - Database path
   * @param {Function} callback - Callback function
   * @param {Object} options - Query options
   * @returns {Function} Unsubscribe function
   */
  subscribeToCollection(path, callback, options = {}) {
    let dataRef = ref(db, path);
    
    // Apply query constraints if provided
    if (options.orderBy || options.equalTo) {
      if (options.orderBy && options.equalTo) {
        dataRef = query(
          dataRef, 
          orderByChild(options.orderBy), 
          equalTo(options.equalTo)
        );
      } else if (options.orderBy) {
        dataRef = query(dataRef, orderByChild(options.orderBy));
      }
    }
    
    const onDataChange = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Convert object to array
        const dataArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Apply client-side sorting if needed
        if (options.sortBy) {
          dataArray.sort((a, b) => {
            if (options.sortDirection === 'desc') {
              return a[options.sortBy] < b[options.sortBy] ? 1 : -1;
            }
            return a[options.sortBy] > b[options.sortBy] ? 1 : -1;
          });
        }
        
        callback({
          success: true,
          data: dataArray
        });
      } else {
        callback({
          success: true,
          data: []
        });
      }
    }, (error) => {
      callback({
        success: false,
        error: {
          code: error.code || 'unknown',
          message: error.message || `Error subscribing to ${path}`
        }
      });
    });
    
    // Return unsubscribe function
    return () => off(dataRef, 'value', onDataChange);
  }
}

// Create instance
const databaseService = new DatabaseService();

// Export functions for specific collections
export const usersDB = {
  createUser: (userId, userData) => databaseService.setData(`users/${userId}`, userData),
  getUser: (userId) => databaseService.getData(`users/${userId}`),
  updateUser: (userId, userData) => databaseService.updateData(`users/${userId}`, userData),
  deleteUser: (userId) => databaseService.removeData(`users/${userId}`),
  getAllUsers: (options) => databaseService.getCollection('users', options),
  subscribeToUser: (userId, callback) => databaseService.subscribeToData(`users/${userId}`, callback),
  subscribeToAllUsers: (callback, options) => databaseService.subscribeToCollection('users', callback, options)
};

export const invoicesDB = {
  createInvoice: (data) => databaseService.setData('invoices', data),
  getInvoice: (invoiceId) => databaseService.getData(`invoices/${invoiceId}`),
  updateInvoice: (invoiceId, data) => databaseService.updateData(`invoices/${invoiceId}`, data),
  deleteInvoice: (invoiceId) => databaseService.removeData(`invoices/${invoiceId}`),
  getAllInvoices: (options) => databaseService.getCollection('invoices', options),
  getUserInvoices: (userId) => databaseService.getCollection('invoices', { orderBy: 'userId', equalTo: userId }),
  subscribeToInvoice: (invoiceId, callback) => databaseService.subscribeToData(`invoices/${invoiceId}`, callback),
  subscribeToAllInvoices: (callback, options) => databaseService.subscribeToCollection('invoices', callback, options),
  subscribeToUserInvoices: (userId, callback) => databaseService.subscribeToCollection('invoices', callback, { orderBy: 'userId', equalTo: userId })
};

export const organizationsDB = {
  createOrganization: (data) => databaseService.setData('organizations', data),
  getOrganization: (orgId) => databaseService.getData(`organizations/${orgId}`),
  updateOrganization: (orgId, data) => databaseService.updateData(`organizations/${orgId}`, data),
  deleteOrganization: (orgId) => databaseService.removeData(`organizations/${orgId}`),
  getAllOrganizations: (options) => databaseService.getCollection('organizations', options),
  subscribeToOrganization: (orgId, callback) => databaseService.subscribeToData(`organizations/${orgId}`, callback),
  subscribeToAllOrganizations: (callback, options) => databaseService.subscribeToCollection('organizations', callback, options)
};

export const settingsDB = {
  getSettings: (orgId) => databaseService.getData(`settings/${orgId}`),
  updateSettings: (orgId, data) => databaseService.updateData(`settings/${orgId}`, data),
  setSettings: (orgId, data) => databaseService.setData(`settings/${orgId}`, data)
};

export const logsDB = {
  addLog: (data) => databaseService.setData('logs', data),
  getAllLogs: (options) => databaseService.getCollection('logs', options)
};

// Export database service
export default databaseService; 