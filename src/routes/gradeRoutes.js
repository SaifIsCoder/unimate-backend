const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const gradeController = require('../controllers/gradeController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Grade Routes
 */

// Validation rules
const gradeValidation = [
    body('classId').isMongoId().withMessage('Valid class ID is required'),
    body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
    body('studentId').isMongoId().withMessage('Valid student ID is required'),
    body('value').isNumeric().withMessage('Value must be a number'),
    body('component').optional().trim(),
    body('maxValue').optional().isNumeric().withMessage('Max value must be a number'),
    body('weight').optional().isNumeric().withMessage('Weight must be a number')
];

const batchValidation = [
    body('classId').isMongoId().withMessage('Valid class ID is required'),
    body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
    body('grades').isArray().withMessage('Grades must be an array'),
    body('grades.*.studentId').isMongoId().withMessage('Valid student ID is required'),
    body('grades.*.value').isNumeric().withMessage('Value must be a number')
];

const overrideValidation = [
    body('value').isNumeric().withMessage('Value must be a number'),
    body('reason').optional().trim()
];

const idValidation = [
    param('id').isMongoId().withMessage('Valid grade ID is required')
];

/**
 * @swagger
 * /api/v1/grades/my:
 *   get:
 *     summary: Get my grades (student)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, gradeController.getMyGrades);

/**
 * @swagger
 * /api/v1/grades/class/{classId}:
 *   get:
 *     summary: Get grades for a class
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/class/:classId',
    authenticate,
    requireRole(['admin', 'teacher']),
    [param('classId').isMongoId()],
    gradeController.getGradesByClass
);

/**
 * @swagger
 * /api/v1/grades/student/{studentId}:
 *   get:
 *     summary: Get grades for a student
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/student/:studentId',
    authenticate,
    requireRole(['admin', 'teacher']),
    [param('studentId').isMongoId()],
    gradeController.getStudentGrades
);

/**
 * @swagger
 * /api/v1/grades/class/{classId}/student/{studentId}/summary:
 *   get:
 *     summary: Get grade summary for a student in a class
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/class/:classId/student/:studentId/summary',
    authenticate,
    [param('classId').isMongoId(), param('studentId').isMongoId()],
    gradeController.getGradeSummary
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   get:
 *     summary: Get grade by ID
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, idValidation, gradeController.getGradeById);

/**
 * @swagger
 * /api/v1/grades:
 *   post:
 *     summary: Create or update a grade
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/',
    authenticate,
    requireRole(['admin', 'teacher']),
    gradeValidation,
    gradeController.upsertGrade
);

/**
 * @swagger
 * /api/v1/grades/batch:
 *   post:
 *     summary: Batch grade entry
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/batch',
    authenticate,
    requireRole(['admin', 'teacher']),
    batchValidation,
    gradeController.batchGradeEntry
);

/**
 * @swagger
 * /api/v1/grades/{id}/override:
 *   patch:
 *     summary: Override a grade (admin only)
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    '/:id/override',
    authenticate,
    requireRole(['admin']),
    idValidation,
    overrideValidation,
    gradeController.overrideGrade
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   delete:
 *     summary: Delete a grade
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    '/:id',
    authenticate,
    requireRole(['admin']),
    idValidation,
    gradeController.deleteGrade
);

module.exports = router;
