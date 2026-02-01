// userService.js
// All user-related business logic is implemented here.
// Controllers must not contain business logic.

const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get user by ID (tenant-scoped)
 */
async function getUserById(tenantId, userId) {
  const user = await User.findOne({ _id: userId, tenantId }).select('-passwordHash');
  if (!user) throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  return user;
}

/**
 * Update user profile
 */
async function updateUserProfile(tenantId, userId, updates) {
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  if (updates.fullName) user.profile.fullName = updates.fullName;
  if (updates.phone) user.profile.phone = updates.phone;
  if (updates.avatar) user.profile.avatar = updates.avatar;
  await user.save();
  await logAction({ tenantId, userId, action: 'profile_updated', entity: 'User', entityId: user._id });
  return user;
}

/**
 * Get all users (tenant-scoped, with filters)
 */
async function getAllUsers(tenantId, filters, pagination) {
  const { role, status, search } = filters;
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;
  let query = { tenantId };
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { 'profile.fullName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  const users = await User.find(query).select('-passwordHash').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  return { users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } };
}

/**
 * Activate/deactivate user
 */
async function setUserStatus(tenantId, userId, status, actingUserId) {
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  user.status = status;
  await user.save();
  await logAction({ tenantId, userId: actingUserId, action: status === 'active' ? 'user_activated' : 'user_deactivated', entity: 'User', entityId: user._id });
  return user;
}

module.exports = {
  getUserById,
  updateUserProfile,
  getAllUsers,
  setUserStatus
};
