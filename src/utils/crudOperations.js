import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Utility functions for form validation and file uploads
 */

/**
 * Validate form data based on required fields
 * @param {Object} formData - The form data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result with isValid flag and errors object
 */
export const validateForm = (formData, requiredFields) => {
  const errors = {};
  
  for (const field of requiredFields) {
    if (!formData[field]) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} folder - Destination folder in Storage
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise} - Upload result with fileUrl
 */
export const uploadFileWithAPI = async (file, folder = 'files', onProgress = null) => {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise
    return new Promise((resolve, reject) => {
      // Register task events
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress function
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error function
          console.error('Upload error:', error);
          reject({
            success: false,
            error: error.message || 'Upload failed'
          });
        },
        async () => {
          // Success function
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            resolve({
              success: true,
              fileUrl: downloadURL,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            });
          } catch (urlError) {
            reject({
              success: false,
              error: urlError.message || 'Could not get download URL'
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
};

/**
 * Upload a profile picture to Firebase Storage
 * @param {File} file - The profile picture file
 * @param {string} userId - User ID for storage path
 * @param {Function} onProgress - Progress update callback
 * @returns {Promise} - Upload result with fileUrl
 */
export const uploadProfilePictureWithAPI = async (file, userId, onProgress = null) => {
  try {
    // Get file extension
    const fileExt = file.name.split('.').pop();
    
    // Create a storage reference with user ID and timestamp for uniqueness
    const storageRef = ref(storage, `profiles/${userId}/profile_${Date.now()}.${fileExt}`);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise
    return new Promise((resolve, reject) => {
      // Register task events
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress function
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error function
          console.error('Profile picture upload error:', error);
          reject({
            success: false,
            error: error.message || 'Upload failed'
          });
        },
        async () => {
          // Success function
          try {
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            resolve({
              success: true,
              fileUrl: downloadURL,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size
            });
          } catch (urlError) {
            reject({
              success: false,
              error: urlError.message || 'Could not get download URL'
            });
          }
        }
      );
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
}; 