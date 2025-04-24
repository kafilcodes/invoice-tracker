import axios from 'axios';

// Create an instance of axios with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({ 
        message: 'Network error. Please check your internet connection or try again later.' 
      });
    }
    
    // Handle specific status codes
    switch (error.response.status) {
      case 401:
        // Unauthorized - could handle logout here
        console.log('Authentication error, please login again');
        // Optional: localStorage.removeItem('token');
        break;
      case 404:
        console.error('API endpoint not found:', error.config.url);
        break;
      case 500:
        console.error('Server error:', error.response.data);
        break;
      default:
        console.error(`HTTP Error ${error.response.status}:`, error.response.data);
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default api; 