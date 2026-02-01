const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Attendance Routes
 * 
 * All routes require authentication.
 * Mark/Override require teacher or admin role.
 */

// Validation rules
const markValidation = [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('records').isArray().withMessage('Records must be an array'),
    body('records.*.studentId').isMongoId().withMessage('Valid student ID is required'),
    body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status')
];

const overrideValidation = [
    body('studentId').isMongoId().withMessage('Valid student ID is required'),
    body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
    body('reason').optional().trim().notEmpty().withMessage('Reason cannot be empty')
];

const classIdValidation = [
    param('classId').isMongoId().withMessage('Valid class ID is required')
];

const idValidation = [
    param('id').isMongoId().withMessage('Valid attendance ID is required')
];

/**
 * @swagger
 * /api/v1/attendance/class/{classId}:
 *   get:
 *     summary: Get attendance records for a class
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of attendance records
 */
router.get(
    '/class/:classId',
    authenticate,
    classIdValidation,
    attendanceController.getAttendanceByClass
);

/**
 * @swagger
 * /api/v1/attendance/class/{classId}/report:
 *   get:
 *     summary: Get attendance report for a class
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/class/:classId/report',
    authenticate,
    requireRole(['admin', 'teacher']),
    classIdValidation,
    attendanceController.getAttendanceReport
);

/**
 * @swagger
 * /api/v1/attendance/class/{classId}:
 *   post:
 *     summary: Mark attendance for a class
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/class/:classId',
    authenticate,
    requireRole(['admin', 'teacher']),
    classIdValidation,
    markValidation,
    attendanceController.markAttendance
);

/**
 * @swagger
 * /api/v1/attendance/student/{studentId}:
 *   get:
 *     summary: Get attendance for a student
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/student/:studentId',
    authenticate,
    [param('studentId').isMongoId().withMessage('Valid student ID is required')],
    attendanceController.getStudentAttendance
);

/**
 * @swagger
 * /api/v1/attendance/my:
 *   get:
 *     summary: Get current user's attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, attendanceController.getStudentAttendance);

/**
 * @swagger
 * /api/v1/attendance/{id}:
 *   get:
 *     summary: Get attendance by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, idValidation, attendanceController.getAttendanceById);

/**
 * @swagger
 * /api/v1/attendance/{id}/override:
 *   patch:
 *     summary: Override a student's attendance (admin only)
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    '/:id/override',
    authenticate,
    requireRole(['admin']),
    idValidation,
    overrideValidation,
    attendanceController.overrideAttendance
);

module.exports = router;
