const AuditLog = require('../models/AuditLog');

/**
 * Audit Logger Utility
 * 
 * WHY: Centralized audit logging for all critical actions.
 * Never skip audit logs - they're mandatory for security and compliance.
 * Logs are async and non-blocking to avoid impacting performance.
 */

/**
 * Log an action to audit log
 * @param {Object} params - { tenantId, userId, action, entity, entityId, metadata }
 */
const logAction = async (params) => {
  try {
    await AuditLog.create({
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      metadata: params.metadata || {},
      timestamp: new Date()
    });
  } catch (error) {
    // Log error but don't throw - audit logging should never break the main flow
    console.error('Audit log error:', error);
  }
};

module.exports = {
  logAction
};
