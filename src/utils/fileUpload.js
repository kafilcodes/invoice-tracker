import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of attachments per invoice
 */
export const MAX_ATTACHMENTS = 5;

/**
 * Allowed file types for invoice attachments
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

/**
 * Validates a file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSizeMB - Maximum file size in MB
 * @param {Array<string>} options.allowedTypes - Array of allowed MIME types
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateFile = (file, options = {}) => {
  const { 
    maxSizeMB = 10, 
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'] 
  } = options;
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size exceeds maximum limit of ${maxSizeMB}MB`
    };
  }
  
  return { valid: true, error: null };
};

/**
 * Uploads a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The path in the storage bucket
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} - The uploaded file metadata
 */
export const uploadFile = async (file, path, options = {}) => {
  const { onProgress } = options;
  
  // Generate a unique filename to prevent collisions
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const fullPath = `${path}/${uniqueFileName}`;
  
  // Create a storage reference
  const storage = getStorage();
  const storageRef = ref(storage, fullPath);
  
  try {
    // Start the upload
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Call the progress callback if provided
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          // Upload complete, get the download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Resolve with file metadata
          resolve({
            name: file.name,
            originalName: file.name,
            type: file.type,
            size: file.size,
            path: fullPath,
            url: downloadURL,
            createdAt: new Date().toISOString()
          });
        }
      );
    });
  } catch (error) {
    console.error('Error starting upload:', error);
    throw error;
  }
};

/**
 * Uploads multiple files to Firebase Storage
 * @param {Array<File>} files - Array of files to upload
 * @param {string} path - The path in the storage bucket
 * @param {Object} options - Upload options
 * @param {Function} options.onProgress - Progress callback
 * @param {Object} options.validationOptions - File validation options
 * @returns {Promise<Array<Object>>} - Array of uploaded file metadata
 */
export const uploadMultipleFiles = async (files, path, options = {}) => {
  const { onProgress, validationOptions } = options;
  
  // Validate all files first
  const validationResults = Array.from(files).map(file => ({
    file,
    validation: validateFile(file, validationOptions)
  }));
  
  // Check if any files failed validation
  const invalidFiles = validationResults.filter(item => !item.validation.valid);
  if (invalidFiles.length > 0) {
    const errors = invalidFiles.map(item => `${item.file.name}: ${item.validation.error}`);
    throw new Error(`File validation failed: ${errors.join(', ')}`);
  }
  
  // Upload all valid files
  const validFiles = validationResults.filter(item => item.validation.valid).map(item => item.file);
  
  // Create individual progress trackers if needed
  const progressMap = {};
  const updateProgress = () => {
    if (onProgress) {
      const totalProgress = Object.values(progressMap).reduce((sum, value) => sum + value, 0) / validFiles.length;
      onProgress(totalProgress);
    }
  };
  
  // Upload each file
  const uploadPromises = validFiles.map((file, index) => {
    // Create a progress tracker for this file
    progressMap[index] = 0;
    
    // Create file-specific progress callback
    const fileProgressCallback = (progress) => {
      progressMap[index] = progress;
      updateProgress();
    };
    
    // Upload the file
    return uploadFile(file, path, { onProgress: fileProgressCallback });
  });
  
  // Wait for all uploads to complete
  return Promise.all(uploadPromises);
};

/**
 * Deletes a file from Firebase Storage
 * @param {string} path - The complete path in the storage bucket
 * @returns {Promise<void>}
 */
export const deleteFile = async (path) => {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Deletes multiple files from Firebase Storage
 * @param {Array<string>} paths - Array of complete paths in the storage bucket
 * @returns {Promise<void>}
 */
export const deleteMultipleFiles = async (paths) => {
  const deletePromises = paths.map(path => deleteFile(path));
  return Promise.all(deletePromises);
};

/**
 * Check if file type is allowed
 * @param {File} file - The file to check
 * @returns {boolean} - Whether the file type is allowed
 */
export const isFileTypeAllowed = (file) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  return allowedTypes.includes(file.type);
};

/**
 * Check if file size is within limits
 * @param {File} file - The file to check
 * @param {number} maxSize - Maximum size in bytes (default: 5MB)
 * @returns {boolean} - Whether the file size is within limits
 */
export const isFileSizeValid = (file, maxSize = 5 * 1024 * 1024) => {
  return file.size <= maxSize;
};

/**
 * Create a preview URL for a file
 * @param {File} file - The file to preview
 * @returns {string} - The preview URL
 */
export const createFilePreview = (file) => {
  if (!file) return null;
  
  // For images, create a blob URL
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  
  // For PDFs, create a blob URL or return a PDF icon
  if (file.type === 'application/pdf') {
    return URL.createObjectURL(file);
    // Alternative: return a PDF icon
    // return '/icons/pdf-icon.png';
  }
  
  // For other file types, return a generic file icon
  return '/icons/file-icon.png';
};

/**
 * Revoke a preview URL to free up memory
 * @param {string} previewUrl - The preview URL to revoke
 */
export const revokeFilePreview = (previewUrl) => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} - The formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Upload a file to Firebase Storage (for testing/demo purposes only)
 * In production, always upload through the backend API
 * @param {File} file - The file to upload
 * @param {string} userId - The ID of the user uploading the file
 * @param {Function} progressCallback - Callback for upload progress
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export const uploadFileToFirebase = (file, userId, progressCallback = () => {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `invoices/${filename}`);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          progressCallback(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          // Upload completed successfully, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}; 