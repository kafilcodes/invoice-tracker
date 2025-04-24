import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './redux/store';
import './index.css';
import axios from 'axios';

// Set up axios defaults - use Vite env var format (VITE_*)
axios.defaults.baseURL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';

// Set up axios interceptors to add auth token to requests
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get Google Client ID from environment for debugging purposes
console.log('Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
); 