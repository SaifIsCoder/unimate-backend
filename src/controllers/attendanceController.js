const attendanceService = require('../services/attendanceService');
const { validationResult } = require('express-validator');

/**
 * Attendance Controller
 * 
 * WHY: Handles HTTP requests for attendance operations.
 * Contains NO business logic - delegates to attendanceService.
 */

/**
 * Get attendance for a class
 */
const getAttendanceByClass = async (req, res, next) => {
    try {
        const filters = {
            date: req.query.date,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };
        const records = await attendanceService.getAttendanceByClass(
            req.tenantId,
            req.params.classId,
            filters
        );
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance by ID
 */
const getAttendanceById = async (req, res, next) => {
    try {
        const attendance = await attendanceService.getAttendanceById(
            req.tenantId,
            req.params.id
        );
        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance for current student or specific student (admin)
 */
const getStudentAttendance = async (req, res, next) => {
    try {
        const studentId = req.params.studentId || req.user._id;
        const filters = {
            classId: req.query.classId,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };
        const records = await attendanceService.getStudentAttendance(
            req.tenantId,
            studentId,
            filters
        );
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark attendance for a class
 */
const markAttendance = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { date, records } = req.body;
        const attendance = await attendanceService.markAttendance(
            req.tenantId,
            req.user._id,
            req.params.classId,
            date,
            records
        );

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Override attendance (admin only)
 */
const overrideAttendance = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { studentId, status, reason } = req.body;
        const attendance = await attendanceService.overrideAttendance(
            req.tenantId,
            req.user._id,
            req.params.id,
            studentId,
            status,
            reason
        );

        res.json({
            success: true,
            message: 'Attendance overridden successfully',
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance report
 */
const getAttendanceReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }

        const report = await attendanceService.getAttendanceReport(
            req.tenantId,
            req.params.classId,
            startDate,
            endDate
        );

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAttendanceByClass,
    getAttendanceById,
    getStudentAttendance,
    markAttendance,
    overrideAttendance,
    getAttendanceReport
};
