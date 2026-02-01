// academicCycleService.js
// All academic cycle-related business logic is implemented here.
// Controllers must not contain business logic.

const AcademicCycle = require('../models/AcademicCycle');
const Program = require('../models/Program');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

async function getAllCycles(tenantId, filters) {
  const query = { tenantId };
  if (filters.programId) query.programId = filters.programId;
  return AcademicCycle.find(query)
    .populate('programId', 'name code')
    .sort({ sequenceNumber: 1 });
}

async function getCycleById(tenantId, id) {
  const cycle = await AcademicCycle.findOne({ _id: id, tenantId }).populate('programId', 'name code');
  if (!cycle) throw new AppError('Academic cycle not found', 404, ERROR_CODES.NOT_FOUND);
  return cycle;
}

async function createCycle(tenantId, userId, data) {
  const program = await Program.findOne({ _id: data.programId, tenantId });
  if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  const cycle = await AcademicCycle.create({ tenantId, ...data });
  await logAction({ tenantId, userId, action: 'academic_cycle_created', entity: 'AcademicCycle', entityId: cycle._id });
  return cycle;
}

async function updateCycle(tenantId, userId, id, data) {
  if (data.programId) {
    const program = await Program.findOne({ _id: data.programId, tenantId });
    if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  }
  const cycle = await AcademicCycle.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  if (!cycle) throw new AppError('Academic cycle not found', 404, ERROR_CODES.NOT_FOUND);
  await logAction({ tenantId, userId, action: 'academic_cycle_updated', entity: 'AcademicCycle', entityId: cycle._id });
  return cycle;
}

async function deleteCycle(tenantId, userId, id) {
  // SOFT DELETE: set deletedAt instead of hard delete
  const cycle = await AcademicCycle.findOne({ _id: id, tenantId });
  if (!cycle) throw new AppError('Academic cycle not found', 404, ERROR_CODES.NOT_FOUND);
  cycle.deletedAt = new Date();
  await cycle.save();
  await logAction({ tenantId, userId, action: 'academic_cycle_deleted', entity: 'AcademicCycle', entityId: cycle._id });
  return { message: 'Academic cycle deleted successfully' };
}

module.exports = {
  getAllCycles,
  getCycleById,
  createCycle,
  updateCycle,
  deleteCycle
};
