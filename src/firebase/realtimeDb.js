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
  subscribeToCollection(collectionPath, callback, options = {}) {
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
}

// Create an instance to export
const realtimeDB = new RealtimeDBService();

export default realtimeDB; 