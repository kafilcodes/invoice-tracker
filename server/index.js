const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Routes
const authRoutes = require('./routes/auth');
const invoiceRoutes = require('./routes/invoices');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const actionRoutes = require('./routes/actions');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/actions', actionRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Invoice Tracker API is running');
});

// Error handling middleware
app.use(errorHandler);

// MongoDB Atlas connection string - with the correct password
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kafil:admin0@cluster0.94n2uma.mongodb.net/invoice-tracker?retryWrites=true&w=majority&appName=Cluster0';

// For debugging
console.log('Attempting to connect to MongoDB Atlas...');

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  }); 