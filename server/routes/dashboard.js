const express = require('express');
const {
  getStats,
  getActivity,
  getInvoiceFlow
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Dashboard routes
router.get('/stats', getStats);
router.get('/activity', getActivity);
router.get('/invoices/flow', authorize('admin'), getInvoiceFlow);

module.exports = router; 