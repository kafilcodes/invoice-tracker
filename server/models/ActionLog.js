const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['created', 'assigned', 'reassigned', 'approved', 'rejected', 'paid'],
    required: true,
  },
  previousStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', null],
    default: null,
  },
  newStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid', null],
    default: null,
  },
  reason: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  previousAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for common queries
actionLogSchema.index({ invoiceId: 1 });
actionLogSchema.index({ performedBy: 1 });
actionLogSchema.index({ timestamp: -1 });

const ActionLog = mongoose.model('ActionLog', actionLogSchema);

module.exports = ActionLog; 