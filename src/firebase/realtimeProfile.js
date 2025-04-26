import { rtdb } from './config';

/**
 * Get a user's profile from Realtime Database
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    const path = `users/${userId}`;
    const result = await rtdb.getData(path);
    
    if (result.success && result.exists) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Update a user's profile in Realtime Database
 * @param {string} userId - The user ID
 * @param {Object} profileData - The profile data to update
 * @returns {Promise<Object>} Updated profile data
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const path = `users/${userId}`;
    
    // Check if the profile already exists
    const profileExists = await rtdb.getData(path);
    
    // Check if we should create the profile if it doesn't exist
    const createIfNotExists = profileData._createIfNotExists;
    delete profileData._createIfNotExists;
    
    // Check if we should only update specific fields
    const fieldsToUpdate = profileData._fieldsToUpdate;
    delete profileData._fieldsToUpdate;
    
    // If we have specific fields to update, only include those
    let dataToUpdate = profileData;
    if (fieldsToUpdate && Array.isArray(fieldsToUpdate)) {
      dataToUpdate = {};
      fieldsToUpdate.forEach(field => {
        if (field in profileData) {
          dataToUpdate[field] = profileData[field];
        }
      });
    }
    
    // If profile exists, update it
    if (profileExists.exists) {
      const result = await rtdb.updateData(path, dataToUpdate);
      
      if (result.success) {
        // Return the combined data (existing + updated)
        return {
          ...profileExists.data,
          ...dataToUpdate
        };
      }
    } 
    // If profile doesn't exist and we should create it
    else if (createIfNotExists) {
      const result = await rtdb.setData(path, dataToUpdate);
      
      if (result.success) {
        return dataToUpdate;
      }
    }
    
    throw new Error('Failed to update user profile');
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 