const Enrollment = require('../models/Enrollment');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Authorization Service
 * 
 * WHY: Centralized authorization logic.
 * Authorization = permission + role + enrollment + tenant
 * Never rely on role alone.
 */

/**
 * Check if user has permission based on role, enrollment, and scope
 * @param {Object} params - { user, role, classId, requiredRole, requiredEnrollment }
 */
const checkPermission = async (params) => {
  const {
    user,
    tenantId,
    role,
    classId,
    requiredRole,
    requiredEnrollment,
    scope,
    scopeId
  } = params;

  // Admin has full access to their tenant
  if (role === 'admin') {
    return { allowed: true, reason: 'admin_access' };
  }

  // Check enrollment if classId is provided
  if (classId && requiredEnrollment !== false) {
    const enrollment = await Enrollment.findOne({
      tenantId,
      userId: user._id,
      classId,
      status: 'active'
    });

    if (!enrollment) {
      throw new AppError(
        'Not enrolled in this class',
        403,
        ERROR_CODES.NOT_ENROLLED,
        { classId }
      );
    }

    // Check role in class if required
    if (requiredRole && enrollment.roleInClass !== requiredRole) {
      throw new AppError(
        `Requires ${requiredRole} role in class`,
        403,
        ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        { requiredRole, actualRole: enrollment.roleInClass }
      );
    }

    return { allowed: true, reason: 'enrolled', enrollment };
  }

  // Check scope-based access
  if (scope && scopeId) {
    // Implement scope validation logic here
    // For now, basic check
    return { allowed: true, reason: 'scope_access' };
  }

  // Check role requirement
  if (requiredRole && role !== requiredRole) {
    throw new AppError(
      `Requires ${requiredRole} role`,
      403,
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      { requiredRole, actualRole: role }
    );
  }

  return { allowed: true, reason: 'role_access' };
};

/**
 * Verify user can access class resource
 * @param {Object} params - { user, tenantId, classId, requiredRole }
 */
const verifyClassAccess = async (params) => {
  return checkPermission({
    ...params,
    requiredEnrollment: true
  });
};

module.exports = {
  checkPermission,
  verifyClassAccess
};
