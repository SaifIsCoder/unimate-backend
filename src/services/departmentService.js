const Department = require('../models/Department');
const { AppError, ERROR_CODES } = require('../utils/errors');
const { getPaginationParams, formatPaginationResponse } = require('../utils/pagination');

/**
 * Department Service
 * 
 * WHY: Business logic separation from controllers.
 * Services handle data operations, controllers handle HTTP.
 */

/**
 * Get all departments with pagination
 */
const getAllDepartments = async (tenantId, query) => {
  const { page, limit, skip } = getPaginationParams({ query });
  
  const filter = { tenantId };
  if (query.status) {
    filter.status = query.status;
  }

  const [departments, total] = await Promise.all([
    Department.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Department.countDocuments(filter)
  ]);

  return formatPaginationResponse(departments, page, limit, total);
};

/**
 * Get department by ID
 */
const getDepartmentById = async (tenantId, departmentId) => {
  const department = await Department.findOne({
    _id: departmentId,
    tenantId
  });

  if (!department) {
    throw new AppError(
      'Department not found',
      404,
      ERROR_CODES.NOT_FOUND,
      { departmentId }
    );
  }

  return department;
};

/**
 * Create department
 */
const createDepartment = async (tenantId, data, userId) => {
  // Check for duplicate code
  const existing = await Department.findOne({
    tenantId,
    code: data.code.toUpperCase()
  });

  if (existing) {
    throw new AppError(
      'Department code already exists',
      400,
      ERROR_CODES.DUPLICATE_ENTRY,
      { code: data.code }
    );
  }

  const department = await Department.create({
    tenantId,
    ...data,
    code: data.code.toUpperCase()
  });

  return department;
};

/**
 * Update department
 */
const updateDepartment = async (tenantId, departmentId, data, userId) => {
  const department = await Department.findOne({
    _id: departmentId,
    tenantId
  });

  if (!department) {
    throw new AppError(
      'Department not found',
      404,
      ERROR_CODES.NOT_FOUND,
      { departmentId }
    );
  }

  // Check for duplicate code if updating
  if (data.code) {
    const existing = await Department.findOne({
      tenantId,
      code: data.code.toUpperCase(),
      _id: { $ne: departmentId }
    });

    if (existing) {
      throw new AppError(
        'Department code already exists',
        400,
        ERROR_CODES.DUPLICATE_ENTRY,
        { code: data.code }
      );
    }

    data.code = data.code.toUpperCase();
  }

  Object.assign(department, data);
  await department.save();

  return department;
};

/**
 * Soft delete department
 */
const deleteDepartment = async (tenantId, departmentId, userId) => {
  const department = await Department.findOne({
    _id: departmentId,
    tenantId
  });

  if (!department) {
    throw new AppError(
      'Department not found',
      404,
      ERROR_CODES.NOT_FOUND,
      { departmentId }
    );
  }

  // Soft delete
  department.deletedAt = new Date();
  await department.save();

  return { message: 'Department deleted successfully' };
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
