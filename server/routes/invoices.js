const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateStatus,
  assignReviewer
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Protect all routes
router.use(protect);

// Invoice routes
router.route('/')
  .post(upload.single('file'), createInvoice)
  .get(getInvoices);

router.route('/:id')
  .get(getInvoice)
  .put(upload.single('file'), updateInvoice);

router.put('/:id/status', updateStatus);
router.put('/:id/assign', authorize('admin'), assignReviewer);

module.exports = router; 