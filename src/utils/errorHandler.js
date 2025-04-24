import { toast } from 'react-toastify';

/**
 * Handles API errors consistently throughout the application
 * @param {Error} error - The error object
 * @param {string} fallbackMessage - Fallback message if error doesn't have a message
 * @param {boolean} showToast - Whether to show a toast notification
 * @returns {string} The error message
 */
export const handleApiError = (error, fallbackMessage = 'An unexpected error occurred', showToast = true) => {
  // Extract the message from different types of error objects
  let errorMessage = fallbackMessage;
  
  if (error.response) {
    // The request was made and the server responded with an error status
    errorMessage = error.response.data?.message || `Error: ${error.response.status} ${error.response.statusText}`;
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from server. Please check your internet connection.';
  } else if (error.message) {
    // Something else happened in setting up the request
    errorMessage = error.message;
  }
  
  // Show toast notification if requested
  if (showToast) {
    toast.error(errorMessage);
  }
  
  // Log the error to the console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error:', error);
  }
  
  return errorMessage;
};

/**
 * Log errors to a service (would be implemented with a real service)
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about the error
 */
export const logErrorToService = (error, context = {}) => {
  // In a real app, this would send to a service like Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error, { extra: context });
  
  // For now, just log to console in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error logged:', error, 'Context:', context);
  }
};

/**
 * Creates a rejected promise with a formatted error
 * @param {string} message - The error message
 * @returns {Promise} A rejected promise
 */
export const createError = (message) => {
  return Promise.reject(new Error(message));
};

export default {
  handleApiError,
  logErrorToService,
  createError
}; 