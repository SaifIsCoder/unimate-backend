const gradeService = require('../services/gradeService');
const { validationResult } = require('express-validator');

/**
 * Grade Controller
 * 
 * WHY: Handles HTTP requests for grade operations.
 * Contains NO business logic - delegates to gradeService.
 */

/**
 * Get grades for a class
 */
const getGradesByClass = async (req, res, next) => {
    try {
        const filters = {
            subjectId: req.query.subjectId,
            studentId: req.query.studentId
        };
        const grades = await gradeService.getGradesByClass(
            req.tenantId,
            req.params.classId,
            filters
        );
        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my grades (student)
 */
const getMyGrades = async (req, res, next) => {
    try {
        const filters = {
            classId: req.query.classId,
            subjectId: req.query.subjectId
        };
        const grades = await gradeService.getStudentGrades(
            req.tenantId,
            req.user._id,
            filters
        );
        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student grades (admin/teacher)
 */
const getStudentGrades = async (req, res, next) => {
    try {
        const filters = {
            classId: req.query.classId,
            subjectId: req.query.subjectId
        };
        const grades = await gradeService.getStudentGrades(
            req.tenantId,
            req.params.studentId,
            filters
        );
        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get grade by ID
 */
const getGradeById = async (req, res, next) => {
    try {
        const grade = await gradeService.getGradeById(req.tenantId, req.params.id);
        res.json({
            success: true,
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create or update grade
 */
const upsertGrade = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const grade = await gradeService.upsertGrade(
            req.tenantId,
            req.user._id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Grade saved successfully',
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Batch grade entry
 */
const batchGradeEntry = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { classId, subjectId, grades } = req.body;
        const results = await gradeService.batchGradeEntry(
            req.tenantId,
            req.user._id,
            classId,
            subjectId,
            grades
        );

        res.status(201).json({
            success: true,
            message: 'Grades saved successfully',
            data: results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Override grade (admin only)
 */
const overrideGrade = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { value, reason } = req.body;
        const grade = await gradeService.overrideGrade(
            req.tenantId,
            req.user._id,
            req.params.id,
            value,
            reason
        );

        res.json({
            success: true,
            message: 'Grade overridden successfully',
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get grade summary
 */
const getGradeSummary = async (req, res, next) => {
    try {
        const summary = await gradeService.getGradeSummary(
            req.tenantId,
            req.params.classId,
            req.params.studentId
        );
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete grade
 */
const deleteGrade = async (req, res, next) => {
    try {
        const result = await gradeService.deleteGrade(
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
    getGradesByClass,
    getMyGrades,
    getStudentGrades,
    getGradeById,
    upsertGrade,
    batchGradeEntry,
    overrideGrade,
    getGradeSummary,
    deleteGrade
};
