import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/invoices';

// Get all invoices with filtering, sorting and pagination
export const getInvoices = createAsyncThunk(
  'invoices/getAll',
  async (params, thunkAPI) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Add sorting params
      if (params.sortField) queryParams.append('sortField', params.sortField);
      if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
      
      // Add filter params
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.date) {
        const [year, month] = params.date.split('-');
        queryParams.append('year', year);
        queryParams.append('month', month);
      }
      
      const response = await axios.get(`${API_URL}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoices'
      );
    }
  }
);

// Get a single invoice by ID
export const getInvoiceById = createAsyncThunk(
  'invoices/getById',
  async (id, thunkAPI) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch invoice'
      );
    }
  }
);

// Create a new invoice
export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (invoiceData, thunkAPI) => {
    try {
      const response = await axios.post(API_URL, invoiceData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to create invoice'
      );
    }
  }
);

// Update an existing invoice
export const updateInvoice = createAsyncThunk(
  'invoices/update',
  async ({ id, invoiceData }, thunkAPI) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to update invoice'
      );
    }
  }
);

// Update invoice status
export const updateInvoiceStatus = createAsyncThunk(
  'invoices/updateStatus',
  async ({ id, statusData }, thunkAPI) => {
    try {
      const response = await axios.put(`${API_URL}/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to update invoice status'
      );
    }
  }
);

// Upload attachment to invoice
export const uploadInvoiceAttachment = createAsyncThunk(
  'invoices/uploadAttachment',
  async ({ id, formData }, thunkAPI) => {
    try {
      const response = await axios.post(`${API_URL}/${id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to upload attachment'
      );
    }
  }
);

// Get dashboard statistics
export const getDashboardStats = createAsyncThunk(
  'invoices/getDashboardStats',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard stats'
      );
    }
  }
);

// Get recent activity
export const getRecentActivity = createAsyncThunk(
  'invoices/getRecentActivity',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get('/api/dashboard/activity');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recent activity'
      );
    }
  }
);

// Sample data for development (will be removed when API is ready)
const sampleInvoices = [
  {
    _id: '1',
    invoiceNumber: 'INV-001',
    vendorName: 'Acme Corp',
    vendorAddress: '123 Main St, City, State, 12345',
    amount: 1500.75,
    description: 'Monthly services',
    status: 'pending',
    dueDate: new Date(2023, 6, 15),
    createdAt: new Date(2023, 5, 15),
    items: [
      { description: 'Service A', quantity: 2, unitPrice: 500.25 },
      { description: 'Service B', quantity: 1, unitPrice: 500.25 },
    ],
  },
  {
    _id: '2',
    invoiceNumber: 'INV-002',
    vendorName: 'Tech Solutions',
    vendorAddress: '456 Tech Blvd, Innovation City, State, 67890',
    amount: 2300.00,
    description: 'Software licenses',
    status: 'approved',
    dueDate: new Date(2023, 6, 20),
    createdAt: new Date(2023, 5, 20),
    items: [
      { description: 'Software License', quantity: 5, unitPrice: 460.00 },
    ],
  },
  {
    _id: '3',
    invoiceNumber: 'INV-003',
    vendorName: 'Global Supplies',
    vendorAddress: '789 Supply Rd, Warehouse District, State, 54321',
    amount: 750.50,
    description: 'Office supplies',
    status: 'rejected',
    dueDate: new Date(2023, 6, 25),
    createdAt: new Date(2023, 5, 25),
    items: [
      { description: 'Paper Packs', quantity: 10, unitPrice: 25.50 },
      { description: 'Ink Cartridges', quantity: 5, unitPrice: 50.00 },
      { description: 'Stationery Set', quantity: 8, unitPrice: 25.00 },
    ],
  },
  {
    _id: '4',
    invoiceNumber: 'INV-004',
    vendorName: 'Marketing Experts',
    vendorAddress: '321 Marketing Way, Creative District, State, 98765',
    amount: 3500.00,
    description: 'Q2 Marketing Campaign',
    status: 'paid',
    dueDate: new Date(2023, 6, 30),
    createdAt: new Date(2023, 5, 30),
    items: [
      { description: 'Social Media Campaign', quantity: 1, unitPrice: 2000.00 },
      { description: 'Email Newsletter', quantity: 1, unitPrice: 1500.00 },
    ],
  },
];

// Sample dashboard stats for development
const sampleStats = {
  counts: {
    pending: 12,
    approved: 8,
    rejected: 3,
    paid: 25,
  },
  amounts: {
    pending: 24500.75,
    approved: 18370.25,
    rejected: 4325.50,
    paid: 67850.30,
  },
  monthly: [
    { month: 1, year: 2023, count: 12 },
    { month: 2, year: 2023, count: 15 },
    { month: 3, year: 2023, count: 10 },
    { month: 4, year: 2023, count: 18 },
    { month: 5, year: 2023, count: 22 },
    { month: 6, year: 2023, count: 16 },
  ],
};

// Sample activity for development
const sampleActivity = [
  {
    _id: '1',
    action: 'created',
    timestamp: new Date(2023, 5, 30, 10, 15),
    performedBy: { _id: '101', name: 'John Doe' },
    invoiceId: {
      _id: '1',
      vendorName: 'Acme Corp',
      amount: 1500.75,
    },
  },
  {
    _id: '2',
    action: 'approved',
    timestamp: new Date(2023, 5, 29, 14, 30),
    performedBy: { _id: '102', name: 'Jane Smith' },
    invoiceId: {
      _id: '2',
      vendorName: 'Tech Solutions',
      amount: 2300.00,
    },
  },
  {
    _id: '3',
    action: 'rejected',
    timestamp: new Date(2023, 5, 28, 9, 45),
    reason: 'Incorrect amount',
    performedBy: { _id: '102', name: 'Jane Smith' },
    invoiceId: {
      _id: '3',
      vendorName: 'Global Supplies',
      amount: 750.50,
    },
  },
];

const initialState = {
  invoices: [],
  currentInvoice: null,
  total: 0,
  loading: false,
  error: null,
  success: false,
  stats: null,
  activity: [],
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    resetInvoiceState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    // In development mode, use sample data
    mockInvoiceData: (state) => {
      state.invoices = sampleInvoices;
      state.total = sampleInvoices.length;
      state.loading = false;
      state.error = null;
    },
    mockDashboardStats: (state) => {
      state.stats = sampleStats;
      state.loading = false;
      state.error = null;
    },
    mockRecentActivity: (state) => {
      state.activity = sampleActivity;
      state.loading = false;
      state.error = null;
    },
    setMockCurrentInvoice: (state, action) => {
      const id = action.payload;
      state.currentInvoice = sampleInvoices.find(inv => inv._id === id) || null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all invoices
      .addCase(getInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices;
        state.total = action.payload.total;
        state.success = true;
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // For development mode
        state.invoices = sampleInvoices;
        state.total = sampleInvoices.length;
      })
      
      // Get invoice by ID
      .addCase(getInvoiceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoiceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInvoice = action.payload;
        state.success = true;
      })
      .addCase(getInvoiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // For development mode
        const id = action.meta.arg;
        state.currentInvoice = sampleInvoices.find(inv => inv._id === id) || null;
      })
      
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Add new invoice to list if available
        if (state.invoices) {
          state.invoices.unshift(action.payload);
          state.total += 1;
        }
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update invoice
      .addCase(updateInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
        
        // Update in list if available
        if (state.invoices) {
          const index = state.invoices.findIndex(
            (invoice) => invoice._id === action.payload._id
          );
          if (index !== -1) {
            state.invoices[index] = action.payload;
          }
        }
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update invoice status
      .addCase(updateInvoiceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateInvoiceStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
        
        // Update in list if available
        if (state.invoices) {
          const index = state.invoices.findIndex(
            (invoice) => invoice._id === action.payload._id
          );
          if (index !== -1) {
            state.invoices[index] = action.payload;
          }
        }
      })
      .addCase(updateInvoiceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Upload attachment
      .addCase(uploadInvoiceAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(uploadInvoiceAttachment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentInvoice = action.payload;
      })
      .addCase(uploadInvoiceAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Get dashboard stats
      .addCase(getDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // For development mode
        state.stats = sampleStats;
      })
      
      // Get recent activity
      .addCase(getRecentActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecentActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activity = action.payload;
      })
      .addCase(getRecentActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // For development mode
        state.activity = sampleActivity;
      });
  },
});

export const { 
  resetInvoiceState, 
  mockInvoiceData, 
  mockDashboardStats,
  mockRecentActivity,
  setMockCurrentInvoice,
} = invoiceSlice.actions;
export default invoiceSlice.reducer; 