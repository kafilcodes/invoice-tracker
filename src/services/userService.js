import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users/';

// Create axios instance with auth token
const createAxiosInstance = () => {
  const token = localStorage.getItem('token');
  
  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get all users
const getUsers = async () => {
  const api = createAxiosInstance();
  const response = await api.get(API_URL);
  return response.data;
};

// Get users by role
const getUsersByRole = async (role) => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}role/${role}`);
  return response.data;
};

// Get user by ID
const getUser = async (id) => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}${id}`);
  return response.data;
};

// Update user
const updateUser = async (id, userData) => {
  const api = createAxiosInstance();
  const response = await api.put(`${API_URL}${id}`, userData);
  return response.data;
};

// Delete user
const deleteUser = async (id) => {
  const api = createAxiosInstance();
  const response = await api.delete(`${API_URL}${id}`);
  return response.data;
};

const userService = {
  getUsers,
  getUsersByRole,
  getUser,
  updateUser,
  deleteUser,
};

export default userService; 