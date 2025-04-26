import { ref, set, get, update, remove, query, orderByChild, startAt, endAt, equalTo, onValue, off, push } from 'firebase/database';
import { rtdb } from './config';

/**
 * Service class for Firebase Realtime Database operations
 */
class RealtimeDBService {
  /**
   * Sets data at the specified location
   * @param {string} path - Path to the location (e.g., 'users/userId')
   * @param {Object} data - Data to set
   * @param {boolean} [merge=false] - Whether to merge with existing data (only updates specified fields)
   * @returns {Promise<Object>} - Result object with success status and data or error
   */
  async setData(path, data, merge = false) {
    try {
      const dbRef = ref(rtdb, path);
      
      // Add timestamps
      const timestampedData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // If not merging, add created timestamp
      if (!merge) {
        timestampedData.createdAt = new Date().toISOString();
      }
      
      // If merging, use update() instead of set()
      if (merge) {
        await update(dbRef, timestampedData);
      } else {
        await set(dbRef, timestampedData);
      }
      
      return {
        success: true,
        data: timestampedData
      };
    } catch (error) {
      console.error(`Error setting data at ${path}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Creates a new item with auto-generated ID in the specified collection
   * @param {string} collectionPath - Path to the collection
   * @param {Object} data - Data to set
   * @returns {Promise<Object>} - Result object with success status, data and generated ID
   */
  async createItem(collectionPath, data) {
    try {
      const collectionRef = ref(rtdb, collectionPath);
      const newItemRef = push(collectionRef);
      
      const timestampedData = {
        ...data,
        id: newItemRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newItemRef, timestampedData);
      
      return {
        success: true,
        data: timestampedData,
        id: newItemRef.key
      };
    } catch (error) {
      console.error(`Error creating item in ${collectionPath}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gets data from the specified location
   * @param {string} path - Path to the location
   * @returns {Promise<Object>} - Result object with success status and data or error
   */
  async getData(path) {
    try {
      const dbRef = ref(rtdb, path);
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        return {
          success: true,
          data: snapshot.val(),
          exists: true
        };
      } else {
        return {
          success: true,
          data: null,
          exists: false
        };
      }
    } catch (error) {
      console.error(`Error getting data from ${path}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gets all items from a collection with optional filtering
   * @param {string} collectionPath - Path to the collection
   * @param {Object} [options] - Query options
   * @param {string} [options.orderBy] - Field to order by
   * @param {any} [options.equalTo] - Value that the ordered-by child must equal
   * @param {any} [options.startAt] - Value to start at
   * @param {any} [options.endAt] - Value to end at
   * @returns {Promise<Object>} - Result object with success status and items array or error
   */
  async getItems(collectionPath, options = {}) {
    try {
      let dbRef;
      
      // Apply query constraints if provided
      if (options.orderBy) {
        dbRef = query(ref(rtdb, collectionPath), orderByChild(options.orderBy));
        
        if (options.equalTo !== undefined) {
          dbRef = query(dbRef, equalTo(options.equalTo));
        }
        
        if (options.startAt !== undefined) {
          dbRef = query(dbRef, startAt(options.startAt));
        }
        
        if (options.endAt !== undefined) {
          dbRef = query(dbRef, endAt(options.endAt));
        }
      } else {
        dbRef = ref(rtdb, collectionPath);
      }
      
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          items.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        return {
          success: true,
          data: items
        };
      } else {
        return {
          success: true,
          data: []
        };
      }
    } catch (error) {
      console.error(`Error getting items from ${collectionPath}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Updates data at the specified location
   * @param {string} path - Path to the location
   * @param {Object} data - Data to update (only specified fields will be updated)
   * @returns {Promise<Object>} - Result object with success status and data or error
   */
  async updateData(path, data) {
    try {
      const dbRef = ref(rtdb, path);
      
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      await update(dbRef, updateData);
      
      return {
        success: true,
        data: updateData
      };
    } catch (error) {
      console.error(`Error updating data at ${path}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pushes data to a location, generating a unique key
   * @param {string} path - Path to the location
   * @param {Object} data - Data to push
   * @returns {Promise<Object>} - Result object with success status, data and generated key
   */
  async pushData(path, data) {
    try {
      const dbRef = ref(rtdb, path);
      
      // Add timestamps
      const timestampedData = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Generate a unique key and store the data
      const newRef = push(dbRef);
      await set(newRef, timestampedData);
      
      return {
        success: true,
        data: timestampedData,
        key: newRef.key
      };
    } catch (error) {
      console.error(`Error pushing data to ${path}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Deletes data at the specified location
   * @param {string} path - Path to the location
   * @returns {Promise<Object>} - Result object with success status or error
   */
  async deleteData(path) {
    try {
      const dbRef = ref(rtdb, path);
      await remove(dbRef);
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting data at ${path}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tests write permissions for a specific path in the Realtime Database
   * @param {string} path - The path to test permissions for
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async testDatabasePermissions(path) {
    try {
      // Create a temporary test node
      const testPath = `${path}/_permission_test_${Date.now()}`;
      const testRef = ref(rtdb, testPath);
      
      console.log(`[DB] Testing permissions with write to: ${testPath}`);
      
      // Try to write a small piece of data
      await set(testRef, { timestamp: Date.now() });
      
      // If we get here, the write succeeded - now delete the test node
      await remove(testRef);
      
      console.log(`[DB] Permission test passed for: ${path}`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`[DB] Permission test failed for: ${path}`, error);
      return { 
        success: false, 
        error: error.message || 'Database permission denied',
        code: error.code
      };
    }
  }

  /**
   * Subscribes to changes at the specified location
   * @param {string} path - Path to the location
   * @param {Function} callback - Callback function that receives the data
   * @returns {Function} - Unsubscribe function
   */
  subscribeToData(path, callback) {
    const dbRef = ref(rtdb, path);
    
    const onDataChange = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({
          success: true,
          data: snapshot.val(),
          exists: true
        });
      } else {
        callback({
          success: true,
          data: null,
          exists: false
        });
      }
    }, (error) => {
      console.error(`Error in subscription to ${path}:`, error);
      callback({
        success: false,
        error: error.message
      });
    });
    
    // Return unsubscribe function
    return () => off(dbRef, 'value', onDataChange);
  }

  /**
   * Subscribes to a collection with optional filtering
   * @param {string} collectionPath - Path to the collection
   * @param {Function} callback - Callback function that receives the items array
   * @param {Object} [options] - Query options (same as getItems)
   * @returns {Function} - Unsubscribe function
   */
  async subscribeToCollection(collectionPath, callback, options = {}) {
    let dbRef;
    
    // Apply query constraints if provided
    if (options.orderBy) {
      dbRef = query(ref(rtdb, collectionPath), orderByChild(options.orderBy));
      
      if (options.equalTo !== undefined) {
        dbRef = query(dbRef, equalTo(options.equalTo));
      }
      
      if (options.startAt !== undefined) {
        dbRef = query(dbRef, startAt(options.startAt));
      }
      
      if (options.endAt !== undefined) {
        dbRef = query(dbRef, endAt(options.endAt));
      }
    } else {
      dbRef = ref(rtdb, collectionPath);
    }
    
    const onDataChange = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const items = [];
        snapshot.forEach((childSnapshot) => {
          items.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        callback({
          success: true,
          data: items
        });
      } else {
        callback({
          success: true,
          data: []
        });
      }
    }, (error) => {
      console.error(`Error in collection subscription to ${collectionPath}:`, error);
      callback({
        success: false,
        error: error.message
      });
    });
    
    // Return unsubscribe function
    return () => off(dbRef, 'value', onDataChange);
  }

  /**
   * Logs an activity in the organization's activity log
   * @param {string} organizationId - The organization ID
   * @param {Object} activity - The activity data to log
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async logActivity(organizationId, activity) {
    try {
      // Validate inputs
      if (!organizationId) {
        throw new Error('Organization ID is required for activity logging');
      }
      
      if (!activity || !activity.type || !activity.userId) {
        throw new Error('Invalid activity data: type and userId are required');
      }
      
      // Create activity entry with timestamp if not provided
      const activityData = {
        ...activity,
        timestamp: activity.timestamp || new Date().toISOString(),
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
      };
      
      console.log(`[DB] Logging activity for organization: ${organizationId}`, activityData);
      
      // Path for activities
      const activityPath = `organizations/${organizationId}/activities/${activityData.id}`;
      
      // Log the activity using our setData method
      const result = await this.setData(activityPath, activityData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to log activity');
      }
      
      console.log(`[DB] Successfully logged activity: ${activityData.type}`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`[DB] Error logging activity:`, error);
      
      return { 
        success: false, 
        error: error.message || 'Failed to log activity',
        code: error.code || 'unknown'
      };
    }
  }
}

// Create an instance to export
const realtimeDB = new RealtimeDBService();

export default realtimeDB;

/**
 * Tests write permissions for a specific path in the Realtime Database
 * @param {string} path - The path to test permissions for
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const testDatabasePermissions = async (path) => {
  try {
    // Create a temporary test node
    const testPath = `${path}/_permission_test_${Date.now()}`;
    const testRef = ref(rtdb, testPath);
    
    console.log(`[DB] Testing permissions with write to: ${testPath}`);
    
    // Try to write a small piece of data
    await set(testRef, { timestamp: Date.now() });
    
    // If we get here, the write succeeded - now delete the test node
    await remove(testRef);
    
    console.log(`[DB] Permission test passed for: ${path}`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`[DB] Permission test failed for: ${path}`, error);
    return { 
      success: false, 
      error: error.message || 'Database permission denied',
      code: error.code
    };
  }
};

/**
 * Writes data to a specific path in the Realtime Database
 * @param {string} path - The path to write to
 * @param {Object} data - The data to write
 * @returns {Promise<{success: boolean, error: string|null, data: Object|null}>}
 */
export const setData = async (path, data) => {
  try {
    console.log(`[DB] Writing data to: ${path}`);
    console.log(`[DB] Data size: ~${JSON.stringify(data).length} bytes`);
    
    // Check for empty path
    if (!path || path.trim() === '') {
      throw new Error('Invalid database path: Path cannot be empty');
    }
    
    // Check for improper data format
    if (data === undefined || data === null) {
      throw new Error('Invalid data: Cannot set null or undefined');
    }
    
    // Create a deep copy of the data to ensure we don't have any circular references
    const safeData = JSON.parse(JSON.stringify(data));
    
    // Get a reference to the database path
    const dbRef = ref(rtdb, path);
    
    // Log the write operation with a truncated preview of the data
    const dataPreview = JSON.stringify(safeData).substring(0, 200) + (JSON.stringify(safeData).length > 200 ? '...' : '');
    console.log(`[DB] Writing to ${path}: ${dataPreview}`);
    
    // Perform the write with a timeout to detect hanging operations
    const writePromise = set(dbRef, safeData);
    
    // Wait for the write to complete with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Database write operation timed out after 15 seconds'));
      }, 15000);
      
      // Clear the timeout if the write succeeds or fails
      writePromise.finally(() => clearTimeout(timeoutId));
    });
    
    // Race the write against the timeout
    await Promise.race([writePromise, timeoutPromise]);
    
    console.log(`[DB] Successfully wrote data to: ${path}`);
    
    return { success: true, error: null, data: safeData };
  } catch (error) {
    console.error(`[DB] Error writing data to ${path}:`, error);
    console.error(`[DB] Error code: ${error.code}, message: ${error.message}`);
    
    // Provide detailed error information
    return { 
      success: false, 
      error: error.message || 'Failed to write data to database',
      code: error.code || 'unknown',
      path
    };
  }
};

/**
 * Reads data from a specific path in the Realtime Database
 * @param {string} path - The path to read from
 * @returns {Promise<{success: boolean, error: string|null, data: Object|null}>}
 */
export const getData = async (path) => {
  try {
    console.log(`[DB] Reading data from: ${path}`);
    
    // Check for empty path
    if (!path || path.trim() === '') {
      throw new Error('Invalid database path: Path cannot be empty');
    }
    
    // Get a reference to the database path
    const dbRef = ref(rtdb, path);
    
    // Read the data
    const snapshot = await get(dbRef);
    
    // Check if the data exists
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(`[DB] Successfully read data from: ${path} (exists = true)`);
      
      // Log a preview of the data
      const dataSize = JSON.stringify(data).length;
      console.log(`[DB] Data size: ~${dataSize} bytes`);
      if (dataSize > 1000) {
        console.log(`[DB] Data preview: ${JSON.stringify(data).substring(0, 500)}...`);
      }
      
      return { success: true, error: null, data };
    } else {
      console.log(`[DB] No data found at: ${path} (exists = false)`);
      return { success: true, error: null, data: null };
    }
  } catch (error) {
    console.error(`[DB] Error reading data from ${path}:`, error);
    
    return { 
      success: false, 
      error: error.message || 'Failed to read data from database',
      code: error.code || 'unknown',
      path
    };
  }
};

/**
 * Logs an activity in the organization's activity log
 * @param {string} organizationId - The organization ID
 * @param {Object} activity - The activity data to log
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logActivity = async (organizationId, activity) => {
  try {
    // Validate inputs
    if (!organizationId) {
      throw new Error('Organization ID is required for activity logging');
    }
    
    if (!activity || !activity.type || !activity.userId) {
      throw new Error('Invalid activity data: type and userId are required');
    }
    
    // Create activity entry with timestamp if not provided
    const activityData = {
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString(),
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
    };
    
    console.log(`[DB] Logging activity for organization: ${organizationId}`, activityData);
    
    // Path for activities
    const activityPath = `organizations/${organizationId}/activities/${activityData.id}`;
    
    // Log the activity
    const result = await setData(activityPath, activityData);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to log activity');
    }
    
    console.log(`[DB] Successfully logged activity: ${activityData.type}`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`[DB] Error logging activity:`, error);
    
    return { 
      success: false, 
      error: error.message || 'Failed to log activity',
      code: error.code || 'unknown'
    };
  }
}; 