const classService = require('../services/classService');
const { validationResult } = require('express-validator');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Class Controller
 * 
 * WHY: Manages classes (the core operational unit).
 * All academic activities are class-scoped.
 * Access to class data must go through Enrollment middleware.
 */

const getAll = async (req, res, next) => {
  try {
    const classes = await classService.getAllClasses(req.tenantId, req.query);
    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const classDoc = await classService.getClassById(req.tenantId, req.params.id);
    res.json({ success: true, data: classDoc });
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
    const classDoc = await classService.createClass(req.tenantId, req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Class created successfully', data: classDoc });
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
    const classDoc = await classService.updateClass(req.tenantId, req.user._id, req.params.id, req.body);
    res.json({ success: true, message: 'Class updated successfully', data: classDoc });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await classService.deleteClass(req.tenantId, req.user._id, req.params.id);
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
