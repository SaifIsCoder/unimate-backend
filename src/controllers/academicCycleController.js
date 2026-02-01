const academicCycleService = require('../services/academicCycleService');
const { validationResult } = require('express-validator');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * AcademicCycle Controller
 * 
 * WHY: Manages academic cycles (semesters/terms) for programs.
 * Data-driven approach - cycles are created per program, not hardcoded.
 */

const getAll = async (req, res, next) => {
  try {
    const cycles = await academicCycleService.getAllCycles(req.tenantId, req.query);
    res.json({ success: true, data: cycles });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const cycle = await academicCycleService.getCycleById(req.tenantId, req.params.id);
    res.json({ success: true, data: cycle });
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
    const cycle = await academicCycleService.createCycle(req.tenantId, req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Academic cycle created successfully', data: cycle });
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
    const cycle = await academicCycleService.updateCycle(req.tenantId, req.user._id, req.params.id, req.body);
    res.json({ success: true, message: 'Academic cycle updated successfully', data: cycle });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await academicCycleService.deleteCycle(req.tenantId, req.user._id, req.params.id);
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
