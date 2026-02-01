const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const subjectController = require('../controllers/subjectController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Subject Routes
 * 
 * All routes require authentication.
 * Create/Update/Delete require admin role.
 */

// Validation rules
const createValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('code').trim().notEmpty().withMessage('Code is required'),
    body('creditHours').isInt({ min: 0 }).withMessage('Credit hours must be a positive number'),
    body('programId').isMongoId().withMessage('Valid program ID is required'),
    body('academicCycleId').isMongoId().withMessage('Valid academic cycle ID is required'),
    body('type').optional().isIn(['theory', 'lab', 'hybrid']).withMessage('Type must be theory, lab, or hybrid')
];

const updateValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('code').optional().trim().notEmpty().withMessage('Code cannot be empty'),
    body('creditHours').optional().isInt({ min: 0 }).withMessage('Credit hours must be a positive number'),
    body('programId').optional().isMongoId().withMessage('Valid program ID is required'),
    body('academicCycleId').optional().isMongoId().withMessage('Valid academic cycle ID is required'),
    body('type').optional().isIn(['theory', 'lab', 'hybrid']).withMessage('Type must be theory, lab, or hybrid')
];

const idValidation = [
    param('id').isMongoId().withMessage('Valid subject ID is required')
];

/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by program ID
 *       - in: query
 *         name: academicCycleId
 *         schema:
 *           type: string
 *         description: Filter by academic cycle ID
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/', authenticate, subjectController.getAllSubjects);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject details
 *       404:
 *         description: Subject not found
 */
router.get('/:id', authenticate, idValidation, subjectController.getSubjectById);

/**
 * @swagger
 * /api/v1/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - creditHours
 *               - programId
 *               - academicCycleId
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               creditHours:
 *                 type: number
 *               programId:
 *                 type: string
 *               academicCycleId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [theory, lab, hybrid]
 *     responses:
 *       201:
 *         description: Subject created
 */
router.post(
    '/',
    authenticate,
    requireRole(['admin']),
    createValidation,
    subjectController.createSubject
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   put:
 *     summary: Update a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject updated
 */
router.put(
    '/:id',
    authenticate,
    requireRole(['admin']),
    idValidation,
    updateValidation,
    subjectController.updateSubject
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject deleted
 */
router.delete(
    '/:id',
    authenticate,
    requireRole(['admin']),
    idValidation,
    subjectController.deleteSubject
);

module.exports = router;
