const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const assignmentController = require('../controllers/assignmentController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Assignment Routes
 * 
 * All routes require authentication.
 * Create/Update/Delete require teacher or admin role.
 */

// Validation rules
const createValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('classId').isMongoId().withMessage('Valid class ID is required'),
    body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('maxMarks').isInt({ min: 0 }).withMessage('Max marks must be a positive number'),
    body('description').optional().trim()
];

const updateValidation = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('classId').optional().isMongoId().withMessage('Valid class ID is required'),
    body('subjectId').optional().isMongoId().withMessage('Valid subject ID is required'),
    body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
    body('maxMarks').optional().isInt({ min: 0 }).withMessage('Max marks must be a positive number')
];

const submitValidation = [
    body('content').optional().trim(),
    body('fileUrl').optional().isURL().withMessage('Valid file URL is required')
];

const gradeValidation = [
    body('marks').isInt({ min: 0 }).withMessage('Marks must be a positive number'),
    body('feedback').optional().trim()
];

const idValidation = [
    param('id').isMongoId().withMessage('Valid assignment ID is required')
];

/**
 * @swagger
 * /api/v1/assignments:
 *   get:
 *     summary: Get all assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, assignmentController.getAllAssignments);

/**
 * @swagger
 * /api/v1/assignments/my:
 *   get:
 *     summary: Get my assignments (student)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, assignmentController.getMyAssignments);

/**
 * @swagger
 * /api/v1/assignments/my/submissions:
 *   get:
 *     summary: Get my submissions
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my/submissions', authenticate, assignmentController.getMySubmissions);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, idValidation, assignmentController.getAssignmentById);

/**
 * @swagger
 * /api/v1/assignments:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/',
    authenticate,
    requireRole(['admin', 'teacher']),
    createValidation,
    assignmentController.createAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    '/:id',
    authenticate,
    requireRole(['admin', 'teacher']),
    idValidation,
    updateValidation,
    assignmentController.updateAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    '/:id',
    authenticate,
    requireRole(['admin', 'teacher']),
    idValidation,
    assignmentController.deleteAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}/submissions:
 *   get:
 *     summary: Get all submissions for an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    '/:id/submissions',
    authenticate,
    requireRole(['admin', 'teacher']),
    idValidation,
    assignmentController.getSubmissions
);

/**
 * @swagger
 * /api/v1/assignments/{id}/submit:
 *   post:
 *     summary: Submit an assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    '/:id/submit',
    authenticate,
    idValidation,
    submitValidation,
    assignmentController.submitAssignment
);

/**
 * @swagger
 * /api/v1/assignments/submissions/{submissionId}/grade:
 *   patch:
 *     summary: Grade a submission
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    '/submissions/:submissionId/grade',
    authenticate,
    requireRole(['admin', 'teacher']),
    [param('submissionId').isMongoId().withMessage('Valid submission ID is required')],
    gradeValidation,
    assignmentController.gradeSubmission
);

module.exports = router;
