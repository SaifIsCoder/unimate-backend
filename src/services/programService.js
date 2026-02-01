// programService.js
// All program-related business logic is implemented here.
// Controllers must not contain business logic.

const Program = require('../models/Program');
const Department = require('../models/Department');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

async function getAllPrograms(tenantId, filters) {
  const query = { tenantId };
  if (filters.departmentId) query.departmentId = filters.departmentId;
  return Program.find(query).populate('departmentId', 'name code').sort({ name: 1 });
}

async function getProgramById(tenantId, id) {
  const program = await Program.findOne({ _id: id, tenantId }).populate('departmentId', 'name code');
  if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  return program;
}

async function createProgram(tenantId, userId, data) {
  const department = await Department.findOne({ _id: data.departmentId, tenantId });
  if (!department) throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
  const program = await Program.create({ tenantId, ...data });
  await logAction({ tenantId, userId, action: 'program_created', entity: 'Program', entityId: program._id });
  return program;
}

async function updateProgram(tenantId, userId, id, data) {
  if (data.departmentId) {
    const department = await Department.findOne({ _id: data.departmentId, tenantId });
    if (!department) throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
  }
  const program = await Program.findOneAndUpdate({ _id: id, tenantId }, data, { new: true, runValidators: true });
  if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  await logAction({ tenantId, userId, action: 'program_updated', entity: 'Program', entityId: program._id });
  return program;
}

async function deleteProgram(tenantId, userId, id) {
  // SOFT DELETE: set deletedAt instead of hard delete
  const program = await Program.findOne({ _id: id, tenantId });
  if (!program) throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
  program.deletedAt = new Date();
  await program.save();
  await logAction({ tenantId, userId, action: 'program_deleted', entity: 'Program', entityId: program._id });
  return { message: 'Program deleted successfully' };
}

module.exports = {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram
};
