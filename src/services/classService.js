// classService.js
// All class-related business logic is implemented here.
// Controllers must not contain business logic.

const Class = require('../models/Class');
const Program = require('../models/Program');
const AcademicCycle = require('../models/AcademicCycle');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

async function getAllClasses(tenantId, filters) {
  const query = { tenantId };
  if (filters.programId) query.programId = filters.programId;
  if (filters.academicCycleId) query.academicCycleId = filters.academicCycleId;
  return Class.find(query)
    .populate('programId', 'name')
    .populate('academicCycleId', 'name')
    .sort({ createdAt: -1 });
}

async function getClassById(tenantId, id) {
  const classDoc = await Class.findOne({ _id: id, tenantId })
    .populate('programId', 'name')
    .populate('academicCycleId', 'name startDate endDate');
  if (!classDoc) throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
  return classDoc;
}

async function createClass(tenantId, userId, data) {
  const program = await Program.findOne({ _id: data.programId, tenantId });
  if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  const cycle = await AcademicCycle.findOne({ _id: data.academicCycleId, tenantId, programId: data.programId });
  if (!cycle) throw new AppError('Academic cycle not found or does not belong to this program', 404, ERROR_CODES.NOT_FOUND);
  const classDoc = await Class.create({ tenantId, ...data });
  await logAction({ tenantId, userId, action: 'class_created', entity: 'Class', entityId: classDoc._id });
  return classDoc;
}

async function updateClass(tenantId, userId, id, data) {
  if (data.programId) {
    const program = await Program.findOne({ _id: data.programId, tenantId });
    if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  }
  if (data.academicCycleId) {
    const classDoc = await Class.findById(id);
    const programId = data.programId || classDoc?.programId;
    const cycle = await AcademicCycle.findOne({ _id: data.academicCycleId, tenantId, programId });
    if (!cycle) throw new AppError('Academic cycle not found or does not belong to this program', 404, ERROR_CODES.NOT_FOUND);
  }
  const classDoc = await Class.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  if (!classDoc) throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
  await logAction({ tenantId, userId, action: 'class_updated', entity: 'Class', entityId: classDoc._id });
  return classDoc;
}

async function deleteClass(tenantId, userId, id) {
  // SOFT DELETE: set deletedAt instead of hard delete
  const classDoc = await Class.findOne({ _id: id, tenantId });
  if (!classDoc) throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
  classDoc.deletedAt = new Date();
  await classDoc.save();
  await logAction({ tenantId, userId, action: 'class_deleted', entity: 'Class', entityId: classDoc._id });
  return { message: 'Class deleted successfully' };
}

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
