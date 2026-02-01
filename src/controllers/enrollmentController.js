const enrollmentService = require('../services/enrollmentService');
const { validationResult } = require('express-validator');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Enrollment Controller
 * 
 * WHY: Manages class enrollments (SECURITY CORE).
 * This is the ONLY way users can access class data.
 * Never allow direct class access without enrollment verification.
 */

const getAll = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments(req.tenantId, req.query);
    res.json({ success: true, data: enrollments });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.getEnrollmentById(req.tenantId, req.params.id);
    res.json({ success: true, data: enrollment });
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
    const enrollment = await enrollmentService.createEnrollment(req.tenantId, req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Enrollment created successfully', data: enrollment });
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
    const enrollment = await enrollmentService.updateEnrollment(req.tenantId, req.user._id, req.params.id, req.body);
    res.json({ success: true, message: 'Enrollment updated successfully', data: enrollment });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await enrollmentService.deleteEnrollment(req.tenantId, req.user._id, req.params.id);
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
