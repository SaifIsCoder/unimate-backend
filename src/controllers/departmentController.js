const { validationResult } = require('express-validator');
const departmentService = require('../services/departmentService');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Department Controller
 * 
 * WHY: HTTP layer - handles requests/responses.
 * Business logic is in services layer.
 * All operations are tenant-scoped automatically via middleware.
 */

const getAll = async (req, res, next) => {
  try {
    const result = await departmentService.getAllDepartments(req.tenantId, req.query);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(
      req.tenantId,
      req.params.id
    );

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(
        'Validation failed',
        400,
        ERROR_CODES.VALIDATION_ERROR,
        { errors: errors.array() }
      );
    }

    const department = await departmentService.createDepartment(
      req.tenantId,
      req.body,
      req.user._id
    );

    // Store entity ID for audit middleware
    res.locals.entityId = department._id;

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(
        'Validation failed',
        400,
        ERROR_CODES.VALIDATION_ERROR,
        { errors: errors.array() }
      );
    }

    const department = await departmentService.updateDepartment(
      req.tenantId,
      req.params.id,
      req.body,
      req.user._id
    );

    res.locals.entityId = department._id;

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(
      req.tenantId,
      req.params.id,
      req.user._id
    );

    res.locals.entityId = req.params.id;

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
