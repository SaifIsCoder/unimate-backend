const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Audit Log Controller
 * 
 * WHY: Provides endpoints to retrieve audit logs.
 * Admin-only access for security compliance and monitoring.
 */

/**
 * Get audit logs (admin only)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const {
      userId,
      action,
      entity,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = { tenantId: req.tenantId };

    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (entity) {
      query.entity = entity;
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Fetch logs with user details
    const logs = await AuditLog.find(query)
      .populate('userId', 'email profile.fullName role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit log by ID (admin only)
 */
const getAuditLogById = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;

    const log = await AuditLog.findOne({
      _id: id,
      tenantId: req.tenantId
    }).populate('userId', 'email profile.fullName role');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs by user (admin only)
 */
const getAuditLogsByUser = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify user exists and belongs to tenant
    const user = await User.findOne({
      _id: userId,
      tenantId: req.tenantId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch logs for this user
    const logs = await AuditLog.find({
      tenantId: req.tenantId,
      userId
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments({
      tenantId: req.tenantId,
      userId
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.profile.fullName
      },
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs by entity (admin only)
 */
const getAuditLogsByEntity = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { entity, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {
      tenantId: req.tenantId,
      entity
    };

    if (entityId) {
      query.entityId = entityId;
    }

    // Fetch logs for this entity
    const logs = await AuditLog.find(query)
      .populate('userId', 'email profile.fullName role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      entity,
      entityId: entityId || 'all',
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics (admin only)
 */
const getAuditStats = async (req, res, next) => {
  try {
    // Only admins can view audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get action statistics
    const actionStats = await AuditLog.aggregate([
      {
        $match: {
          tenantId: req.tenantId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get entity statistics
    const entityStats = await AuditLog.aggregate([
      {
        $match: {
          tenantId: req.tenantId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$entity',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get top users by action count
    const userStats = await AuditLog.aggregate([
      {
        $match: {
          tenantId: req.tenantId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          email: '$user.email',
          fullName: '$user.profile.fullName',
          count: 1
        }
      }
    ]);

    const totalLogs = await AuditLog.countDocuments({
      tenantId: req.tenantId,
      timestamp: { $gte: startDate }
    });

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        totalLogs,
        actionStats,
        entityStats,
        userStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getAuditLogsByUser,
  getAuditLogsByEntity,
  getAuditStats
};
