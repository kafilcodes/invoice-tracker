const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Create indexes for common queries
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ vendorName: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ submittedBy: 1 });
invoiceSchema.index({ assignedTo: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice; 