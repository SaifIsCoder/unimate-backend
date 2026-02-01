const subjectService = require('../services/subjectService');
const { validationResult } = require('express-validator');

/**
 * Subject Controller
 * 
 * WHY: Handles HTTP requests for subject operations.
 * Contains NO business logic - delegates to subjectService.
 */

/**
 * Get all subjects
 */
const getAllSubjects = async (req, res, next) => {
    try {
        const filters = {
            programId: req.query.programId,
            academicCycleId: req.query.academicCycleId,
            type: req.query.type
        };
        const subjects = await subjectService.getAllSubjects(req.tenantId, filters);
        res.json({
            success: true,
            data: subjects
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single subject by ID
 */
const getSubjectById = async (req, res, next) => {
    try {
        const subject = await subjectService.getSubjectById(req.tenantId, req.params.id);
        res.json({
            success: true,
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new subject
 */
const createSubject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const subject = await subjectService.createSubject(
            req.tenantId,
            req.user._id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Subject created successfully',
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a subject
 */
const updateSubject = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const subject = await subjectService.updateSubject(
            req.tenantId,
            req.user._id,
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            message: 'Subject updated successfully',
            data: subject
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a subject
 */
const deleteSubject = async (req, res, next) => {
    try {
        const result = await subjectService.deleteSubject(
            req.tenantId,
            req.user._id,
            req.params.id
        );

        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
