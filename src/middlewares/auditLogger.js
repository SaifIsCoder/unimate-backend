const { logAction } = require('../utils/auditLogger');

/**
 * Audit Logging Middleware
 * 
 * WHY: Automatically log all sensitive operations.
 * Ensures every critical action is auditable.
 */

/**
 * Audit middleware factory
 * @param {String} action - Action name (e.g., 'user_created')
 * @param {String} entity - Entity type (e.g., 'User')
 * @param {Function} getEntityId - Function to extract entity ID from request/response
 */
const audit = (action, entity, getEntityId = (req, res) => req.params.id || res.locals.entityId) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to capture response
    res.json = function(data) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          const entityId = getEntityId(req, res);
          
          await logAction({
            tenantId: req.tenantId,
            userId: req.user?._id,
            action,
            entity,
            entityId,
            metadata: {
              method: req.method,
              path: req.path,
              requestId: req.requestId,
              ip: req.ip,
              userAgent: req.get('user-agent'),
              ...(data && { responseStatus: res.statusCode })
            }
          });
        } catch (error) {
          // Don't break the response if audit logging fails
          console.error('Audit logging error:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
};

module.exports = { audit };
