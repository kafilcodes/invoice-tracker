const Invoice = require('../models/Invoice');
const ActionLog = require('../models/ActionLog');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    // Base filter for user role
    const baseFilter = {};
    
    // If not admin, only show invoices submitted by or assigned to the user
    if (req.user.role !== 'admin') {
      baseFilter.$or = [
        { submittedBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }
    
    // Get counts for each status
    const [
      pendingCount,
      approvedCount,
      rejectedCount,
      paidCount,
      totalAmount
    ] = await Promise.all([
      Invoice.countDocuments({ ...baseFilter, status: 'pending' }),
      Invoice.countDocuments({ ...baseFilter, status: 'approved' }),
      Invoice.countDocuments({ ...baseFilter, status: 'rejected' }),
      Invoice.countDocuments({ ...baseFilter, status: 'paid' }),
      Invoice.aggregate([
        { $match: { ...baseFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    // Get amounts for each status
    const [
      pendingAmount,
      approvedAmount
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { ...baseFilter, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.aggregate([
        { $match: { ...baseFilter, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    // Get monthly invoice count for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    const monthlyData = await Invoice.aggregate([
      { 
        $match: { 
          ...baseFilter,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Format monthly data
    const formattedMonthlyData = monthlyData.map(item => ({
      year: item._id.year,
      month: item._id.month,
      count: item.count,
      amount: item.amount
    }));
    
    res.status(200).json({
      success: true,
      data: {
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          paid: paidCount,
          total: pendingCount + approvedCount + rejectedCount + paidCount
        },
        amounts: {
          pending: pendingAmount[0]?.total || 0,
          approved: approvedAmount[0]?.total || 0,
          total: totalAmount[0]?.total || 0
        },
        monthly: formattedMonthlyData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
exports.getActivity = async (req, res, next) => {
  try {
    // Base filter for user role
    const baseFilter = {};
    
    // If not admin, only show actions for invoices submitted by or assigned to the user
    if (req.user.role !== 'admin') {
      // Get invoice IDs for invoices the user has access to
      const invoices = await Invoice.find({
        $or: [
          { submittedBy: req.user._id },
          { assignedTo: req.user._id }
        ]
      }).select('_id');
      
      const invoiceIds = invoices.map(invoice => invoice._id);
      
      baseFilter.invoiceId = { $in: invoiceIds };
    }
    
    // Get recent activity
    const activities = await ActionLog.find(baseFilter)
      .populate({
        path: 'invoiceId',
        select: 'vendorName amount status'
      })
      .populate({
        path: 'performedBy',
        select: 'name'
      })
      .populate({
        path: 'assignedTo',
        select: 'name'
      })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice flow data
// @route   GET /api/dashboard/invoices/flow
// @access  Private/Admin
exports.getInvoiceFlow = async (req, res, next) => {
  try {
    // This endpoint is admin-only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    // Get average time from creation to approval/rejection
    const avgTimeToProcessData = await ActionLog.aggregate([
      {
        $match: {
          action: { $in: ['approved', 'rejected'] }
        }
      },
      {
        $lookup: {
          from: 'actionlogs',
          localField: 'invoiceId',
          foreignField: 'invoiceId',
          as: 'allActions'
        }
      },
      {
        $addFields: {
          creationAction: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$allActions',
                  as: 'action',
                  cond: { $eq: ['$$action.action', 'created'] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $match: {
          creationAction: { $ne: null }
        }
      },
      {
        $addFields: {
          timeDiff: {
            $subtract: ['$timestamp', '$creationAction.timestamp']
          }
        }
      },
      {
        $group: {
          _id: '$action',
          avgTime: { $avg: '$timeDiff' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert milliseconds to days
    const processData = avgTimeToProcessData.map(item => ({
      status: item._id,
      avgDays: parseFloat((item.avgTime / (1000 * 60 * 60 * 24)).toFixed(2)),
      count: item.count
    }));
    
    // Get approval/rejection rate
    const statusData = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format status data
    const formattedStatusData = statusData.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    // Get total count of processed invoices
    const totalProcessed = (formattedStatusData.approved || 0) + (formattedStatusData.rejected || 0);
    
    // Calculate rates
    const rates = {
      approvalRate: totalProcessed > 0 ? 
        parseFloat(((formattedStatusData.approved || 0) / totalProcessed * 100).toFixed(2)) : 0,
      rejectionRate: totalProcessed > 0 ? 
        parseFloat(((formattedStatusData.rejected || 0) / totalProcessed * 100).toFixed(2)) : 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        processingTime: processData,
        rates
      }
    });
  } catch (error) {
    next(error);
  }
}; 