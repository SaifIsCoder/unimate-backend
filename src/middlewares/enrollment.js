const { verifyClassAccess } = require('../services/authorizationService');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Enrollment Validation Middleware
 * 
 * WHY: Class data access MUST go through Enrollment.
 * This is the security core - never allow direct class access.
 * Uses authorization service for consistent permission checks.
 */

/**
 * Verify user is enrolled in a class
 * @param {String} roleInClass - Required role ('student' or 'teacher')
 * @param {String} classIdParam - Request parameter name for classId (default: 'id')
 */
const requireEnrollment = (roleInClass = null, classIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const classId = req.params[classIdParam] || req.body.classId || req.query.classId;

      if (!classId) {
        throw new AppError(
          'Class ID is required',
          400,
          ERROR_CODES.VALIDATION_ERROR
        );
      }

      // Use authorization service to verify access
      const result = await verifyClassAccess({
        user: req.user,
        tenantId: req.tenantId,
        role: req.userRole,
        classId,
        requiredRole: roleInClass
      });

      // Attach enrollment to request for use in controllers
      if (result.enrollment) {
        req.enrollment = result.enrollment;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  requireEnrollment
};
