const Invoice = require('../models/Invoice');
const ActionLog = require('../models/ActionLog');
const { getFileUrl } = require('../middleware/upload');

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res, next) => {
  try {
    const { vendorName, amount, dueDate, category, notes, assignedTo } = req.body;
    
    // Create invoice object
    const invoiceData = {
      vendorName,
      amount,
      dueDate,
      category,
      notes,
      submittedBy: req.user._id,
      assignedTo
    };
    
    // Add file info if uploaded
    if (req.file) {
      invoiceData.fileName = req.file.filename;
      invoiceData.fileUrl = getFileUrl(req, req.file.filename);
    }
    
    // Create invoice
    const invoice = await Invoice.create(invoiceData);
    
    // Log the invoice creation action
    await ActionLog.create({
      invoiceId: invoice._id,
      performedBy: req.user._id,
      action: 'created',
      newStatus: 'pending',
      assignedTo: assignedTo || null
    });
    
    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices with filters
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, vendor, category, startDate, endDate, assignedTo } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add vendor name filter if provided
    if (vendor) {
      filter.vendorName = { $regex: vendor, $options: 'i' };
    }
    
    // Add category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) {
        filter.dueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.dueDate.$lte = new Date(endDate);
      }
    }
    
    // Add assignedTo filter if provided
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    // If user is not admin, only show invoices submitted by or assigned to them
    if (req.user.role !== 'admin') {
      filter.$or = [
        { submittedBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get invoices with pagination and sorting
    const invoices = await Invoice.find(filter)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Invoice.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if user has permission to view this invoice
    if (req.user.role !== 'admin' && 
        invoice.submittedBy._id.toString() !== req.user._id.toString() && 
        (!invoice.assignedTo || invoice.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if user has permission to update this invoice
    if (req.user.role !== 'admin' && invoice.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this invoice'
      });
    }
    
    // Check if invoice is already approved/rejected/paid
    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot update invoice with status ${invoice.status}`
      });
    }
    
    const { vendorName, amount, dueDate, category, notes } = req.body;
    
    // Update invoice data
    const invoiceData = {
      vendorName,
      amount,
      dueDate,
      category,
      notes
    };
    
    // Add file info if uploaded
    if (req.file) {
      invoiceData.fileName = req.file.filename;
      invoiceData.fileUrl = getFileUrl(req, req.file.filename);
    }
    
    // Update invoice
    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      invoiceData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    // Get invoice
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if user has permission to update status
    // Admin can update any invoice status
    // Assigned reviewer can only approve/reject
    // Submitter can only mark as paid
    if (req.user.role !== 'admin') {
      if (status === 'paid' && invoice.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the submitter or admin can mark as paid'
        });
      } else if (['approved', 'rejected'].includes(status) && 
                (!invoice.assignedTo || invoice.assignedTo.toString() !== req.user._id.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Only the assigned reviewer or admin can approve/reject'
        });
      }
    }
    
    // Record current status before update
    const previousStatus = invoice.status;
    
    // Update invoice status
    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    // Log the status change action
    await ActionLog.create({
      invoiceId: invoice._id,
      performedBy: req.user._id,
      action: status, // action is the new status
      previousStatus,
      newStatus: status,
      reason
    });
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign reviewer to invoice
// @route   PUT /api/invoices/:id/assign
// @access  Private
exports.assignReviewer = async (req, res, next) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a user ID'
      });
    }
    
    // Get invoice
    let invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if user has permission to assign
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can assign/reassign invoices'
      });
    }
    
    // Record current assignee before update
    const previousAssignee = invoice.assignedTo;
    
    // Update invoice
    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userId },
      { new: true }
    ).populate('assignedTo', 'name email');
    
    // Determine if this is a new assignment or reassignment
    const action = previousAssignee ? 'reassigned' : 'assigned';
    
    // Log the assignment action
    await ActionLog.create({
      invoiceId: invoice._id,
      performedBy: req.user._id,
      action,
      previousAssignee,
      assignedTo: userId,
      message
    });
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
}; 