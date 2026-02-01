const programService = require('../services/programService');
const { validationResult } = require('express-validator');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Program Controller
 * 
 * WHY: Manages program (degree) CRUD operations.
 * Validates department exists and belongs to tenant.
 */

const getAll = async (req, res, next) => {
  try {
    const programs = await programService.getAllPrograms(req.tenantId, req.query);
    res.json({ success: true, data: programs });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const program = await programService.getProgramById(req.tenantId, req.params.id);
    res.json({ success: true, data: program });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, { errors: errors.array() });
    }
    const program = await programService.createProgram(req.tenantId, req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Program created successfully', data: program });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, { errors: errors.array() });
    }
    const program = await programService.updateProgram(req.tenantId, req.user._id, req.params.id, req.body);
    res.json({ success: true, message: 'Program updated successfully', data: program });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await programService.deleteProgram(req.tenantId, req.user._id, req.params.id);
    res.json({ success: true, message: result.message });
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
