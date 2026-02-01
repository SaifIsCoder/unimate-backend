const userService = require('../services/userService');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * User Controller
 * 
 * WHY: Handles user profile management and CRUD operations.
 * Ensures tenant isolation and proper authorization.
 */

/**
 * Get current user profile
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.tenantId, req.userId);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile by ID (admin/teacher only)
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Only admins can view other users
    if (req.user.role !== 'admin' && req.userId !== id) {
      throw new AppError('Access denied', 403, ERROR_CODES.UNAUTHORIZED);
    }
    const user = await userService.getUserById(req.tenantId, id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.tenantId, req.userId, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, ERROR_CODES.UNAUTHORIZED);
    }
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const result = await userService.getAllUsers(
      req.tenantId,
      { role, status, search },
      { page, limit }
    );
    res.json({ success: true, data: result.users, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user (admin only)
 */
const activateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, ERROR_CODES.UNAUTHORIZED);
    }
    const { id } = req.params;
    const user = await userService.setUserStatus(req.tenantId, id, 'active', req.userId);
    res.json({ success: true, message: 'User activated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user (admin only)
 */
const deactivateUser = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError('Access denied', 403, ERROR_CODES.UNAUTHORIZED);
    }
    const { id } = req.params;
    const user = await userService.setUserStatus(req.tenantId, id, 'inactive', req.userId);
    res.json({ success: true, message: 'User deactivated successfully', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  getUserById,
  updateProfile,
  getAllUsers,
  activateUser,
  deactivateUser
};
