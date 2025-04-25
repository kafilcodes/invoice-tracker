import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The path in storage to upload to
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - URL of the uploaded file
 */
export const uploadFile = async (file, path, progressCallback = null) => {
  try {
    // Generate a unique filename to prevent overwrites
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, fullPath);
    
    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves with the download URL when complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate and report progress if callback provided
          if (progressCallback) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressCallback(progress);
          }
        },
        (error) => {
          // Handle errors
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed, get the download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Upload a profile picture
 * @param {File} file - The image file
 * @param {string} userId - User ID
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - URL of the uploaded image
 */
export const uploadProfilePicture = async (file, userId, progressCallback = null) => {
  return uploadFile(file, `profile-pictures/${userId}`, progressCallback);
};

/**
 * Upload a company logo
 * @param {File} file - The logo file
 * @param {string} companyId - Company ID or unique identifier
 * @param {Function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - URL of the uploaded logo
 */
export const uploadCompanyLogo = async (file, companyId, progressCallback = null) => {
  return uploadFile(file, `company-logos/${companyId}`, progressCallback);
}; 