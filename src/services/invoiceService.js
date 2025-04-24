import axios from 'axios';

const API_URL = 'http://localhost:5000/api/';

// Create axios instance with auth token
const createAxiosInstance = () => {
  const token = localStorage.getItem('token');
  
  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Get all invoices with filters
const getInvoices = async (params = {}) => {
  const api = createAxiosInstance();
  
  // Build query string from params
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.vendor) queryParams.append('vendor', params.vendor);
  if (params.category) queryParams.append('category', params.category);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  
  const response = await api.get(`${API_URL}invoices${queryString}`);
  return response.data;
};

// Get single invoice
const getInvoice = async (id) => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}invoices/${id}`);
  return response.data;
};

// Create new invoice
const createInvoice = async (invoiceData) => {
  const api = createAxiosInstance();
  
  // Create FormData if file is included
  if (invoiceData.file) {
    const formData = new FormData();
    
    // Append all invoice data
    Object.keys(invoiceData).forEach((key) => {
      if (key === 'file') {
        formData.append('file', invoiceData.file);
      } else {
        formData.append(key, invoiceData[key]);
      }
    });
    
    const response = await api.post(`${API_URL}invoices`, formData);
    return response.data;
  } else {
    const response = await api.post(`${API_URL}invoices`, invoiceData);
    return response.data;
  }
};

// Update invoice
const updateInvoice = async (id, invoiceData) => {
  const api = createAxiosInstance();
  
  // Create FormData if file is included
  if (invoiceData.file) {
    const formData = new FormData();
    
    // Append all invoice data
    Object.keys(invoiceData).forEach((key) => {
      if (key === 'file') {
        formData.append('file', invoiceData.file);
      } else {
        formData.append(key, invoiceData[key]);
      }
    });
    
    const response = await api.put(`${API_URL}invoices/${id}`, formData);
    return response.data;
  } else {
    const response = await api.put(`${API_URL}invoices/${id}`, invoiceData);
    return response.data;
  }
};

// Update invoice status
const updateInvoiceStatus = async (id, statusData) => {
  const api = createAxiosInstance();
  const response = await api.put(`${API_URL}invoices/${id}/status`, statusData);
  return response.data;
};

// Assign reviewer to invoice
const assignReviewer = async (id, assignData) => {
  const api = createAxiosInstance();
  const response = await api.put(`${API_URL}invoices/${id}/assign`, assignData);
  return response.data;
};

// Get invoice audit trail
const getInvoiceAuditTrail = async (invoiceId) => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}actions/${invoiceId}`);
  return response.data;
};

// Get dashboard stats
const getDashboardStats = async () => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}dashboard/stats`);
  return response.data;
};

// Get recent activity
const getRecentActivity = async () => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}dashboard/activity`);
  return response.data;
};

// Get invoice flow data (admin only)
const getInvoiceFlowData = async () => {
  const api = createAxiosInstance();
  const response = await api.get(`${API_URL}dashboard/invoices/flow`);
  return response.data;
};

const invoiceService = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  assignReviewer,
  getInvoiceAuditTrail,
  getDashboardStats,
  getRecentActivity,
  getInvoiceFlowData,
};

export default invoiceService; 