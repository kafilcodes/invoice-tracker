const ActionLog = require('../models/ActionLog');
const Invoice = require('../models/Invoice');

// @desc    Get all actions for an invoice
// @route   GET /api/actions/:invoiceId
// @access  Private
exports.getInvoiceActions = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    
    // Check if the invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check if the user has permission to view this invoice's actions
    if (req.user.role !== 'admin' && 
        invoice.submittedBy.toString() !== req.user._id.toString() && 
        (!invoice.assignedTo || invoice.assignedTo.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }
    
    // Get actions with populated user info
    const actions = await ActionLog.find({ invoiceId })
      .populate('performedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('previousAssignee', 'name email')
      .sort({ timestamp: -1 });
    
    res.status(200).json({
      success: true,
      count: actions.length,
      data: actions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all actions performed by current user
// @route   GET /api/actions/user/me
// @access  Private
exports.getUserActions = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Get actions performed by current user
    const actions = await ActionLog.find({ performedBy: req.user._id })
      .populate({
        path: 'invoiceId',
        select: 'vendorName amount status'
      })
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await ActionLog.countDocuments({ performedBy: req.user._id });
    
    res.status(200).json({
      success: true,
      count: actions.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: actions
    });
  } catch (error) {
    next(error);
  }
}; 