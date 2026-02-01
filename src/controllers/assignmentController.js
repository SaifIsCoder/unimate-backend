const assignmentService = require('../services/assignmentService');
const { validationResult } = require('express-validator');

/**
 * Assignment Controller
 * 
 * WHY: Handles HTTP requests for assignment and submission operations.
 * Contains NO business logic - delegates to assignmentService.
 */

/**
 * Get all assignments
 */
const getAllAssignments = async (req, res, next) => {
    try {
        const filters = {
            classId: req.query.classId,
            subjectId: req.query.subjectId
        };
        const assignments = await assignmentService.getAllAssignments(req.tenantId, filters);
        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my assignments (student)
 */
const getMyAssignments = async (req, res, next) => {
    try {
        const assignments = await assignmentService.getAssignmentsForStudent(
            req.tenantId,
            req.user._id
        );
        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get assignment by ID
 */
const getAssignmentById = async (req, res, next) => {
    try {
        const assignment = await assignmentService.getAssignmentById(
            req.tenantId,
            req.params.id
        );
        res.json({
            success: true,
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create assignment
 */
const createAssignment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const assignment = await assignmentService.createAssignment(
            req.tenantId,
            req.user._id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Assignment created successfully',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update assignment
 */
const updateAssignment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const assignment = await assignmentService.updateAssignment(
            req.tenantId,
            req.user._id,
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            message: 'Assignment updated successfully',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete assignment
 */
const deleteAssignment = async (req, res, next) => {
    try {
        const result = await assignmentService.deleteAssignment(
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

/**
 * Get submissions for an assignment
 */
const getSubmissions = async (req, res, next) => {
    try {
        const submissions = await assignmentService.getSubmissions(
            req.tenantId,
            req.params.id
        );
        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit assignment
 */
const submitAssignment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const submission = await assignmentService.submitAssignment(
            req.tenantId,
            req.user._id,
            req.params.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Assignment submitted successfully',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Grade submission
 */
const gradeSubmission = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { marks, feedback } = req.body;
        const submission = await assignmentService.gradeSubmission(
            req.tenantId,
            req.user._id,
            req.params.submissionId,
            marks,
            feedback
        );

        res.json({
            success: true,
            message: 'Submission graded successfully',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my submissions (student)
 */
const getMySubmissions = async (req, res, next) => {
    try {
        const submissions = await assignmentService.getStudentSubmissions(
            req.tenantId,
            req.user._id,
            { status: req.query.status }
        );
        res.json({
            success: true,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllAssignments,
    getMyAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getSubmissions,
    submitAssignment,
    gradeSubmission,
    getMySubmissions
};
