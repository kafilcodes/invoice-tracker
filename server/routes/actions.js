const express = require('express');
const {
  getInvoiceActions,
  getUserActions
} = require('../controllers/actionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Action routes
router.get('/user/me', getUserActions);
router.get('/:invoiceId', getInvoiceActions);

module.exports = router; 