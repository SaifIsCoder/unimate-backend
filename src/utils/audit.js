import logger from "../config/logger.js";

/**
 * Logs a business-level audit event
 * @param {Object} context - { action, actorId, targetId, metadata }
 */
export const logAudit = (context, message) => {
  logger.info({
    event: "AUDIT_LOG",
    ...context,
    timestamp: new Date().toISOString(),
  }, message);
};
