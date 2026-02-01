// enrollmentService.js
// All enrollment-related business logic is implemented here.
// Controllers must not contain business logic.

const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

async function getAllEnrollments(tenantId, filters) {
  const query = { tenantId };
  if (filters.classId) query.classId = filters.classId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.roleInClass) query.roleInClass = filters.roleInClass;
  return Enrollment.find(query)
    .populate('userId', 'email profile.fullName')
    .populate('classId', 'session programId academicCycleId')
    .sort({ joinedAt: -1 });
}

async function getEnrollmentById(tenantId, id) {
  const enrollment = await Enrollment.findOne({ _id: id, tenantId })
    .populate('userId', 'email profile.fullName role')
    .populate('classId', 'session programId academicCycleId');
  if (!enrollment) throw new AppError('Enrollment not found', 404, ERROR_CODES.NOT_FOUND);
  return enrollment;
}

async function createEnrollment(tenantId, actingUserId, data) {
  const { userId, classId, roleInClass } = data;
  const classDoc = await Class.findOne({ _id: classId, tenantId });
  if (!classDoc) throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
  const user = await User.findOne({ _id: userId, tenantId });
  if (!user) throw new AppError('User not found', 404, ERROR_CODES.NOT_FOUND);
  const existingEnrollment = await Enrollment.findOne({ tenantId, userId, classId });
  if (existingEnrollment) throw new AppError('User is already enrolled in this class', 400, ERROR_CODES.VALIDATION_ERROR);
  const enrollment = await Enrollment.create({ tenantId, userId, classId, roleInClass: roleInClass || 'student' });
  await logAction({ tenantId, userId: actingUserId, action: 'enrollment_created', entity: 'Enrollment', entityId: enrollment._id, metadata: { enrolledUserId: userId, classId, roleInClass } });
  return enrollment;
}

async function updateEnrollment(tenantId, actingUserId, id, data) {
  const enrollment = await Enrollment.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  if (!enrollment) throw new AppError('Enrollment not found', 404, ERROR_CODES.NOT_FOUND);
  await logAction({ tenantId, userId: actingUserId, action: 'enrollment_updated', entity: 'Enrollment', entityId: enrollment._id });
  return enrollment;
}

async function deleteEnrollment(tenantId, actingUserId, id) {
  // SOFT DELETE: set deletedAt instead of hard delete
  const enrollment = await Enrollment.findOne({ _id: id, tenantId });
  if (!enrollment) throw new AppError('Enrollment not found', 404, ERROR_CODES.NOT_FOUND);
  enrollment.deletedAt = new Date();
  await enrollment.save();
  await logAction({ tenantId, userId: actingUserId, action: 'enrollment_deleted', entity: 'Enrollment', entityId: enrollment._id });
  return { message: 'Enrollment deleted successfully' };
}

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment
};
