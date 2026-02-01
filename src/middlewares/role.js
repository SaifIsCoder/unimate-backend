/**
 * Role Validation Middleware
 * 
 * WHY: Ensures only users with required roles can access endpoints.
 * Role comes from verified JWT token, never from client.
 */

/**
 * Check if user has required role(s)
 * @param {String|Array} allowedRoles - Single role or array of roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No role information'
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires one of [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = {
  requireRole
};
