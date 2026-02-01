const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Enrollment Routes
 * 
 * WHY: RESTful endpoints for enrollment management (SECURITY CORE).
 * This is the ONLY way users can access class data.
 * Admin and teachers can manage enrollments.
 */

/**
 * @swagger
 * /api/v1/enrollments:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: roleInClass
 *         schema:
 *           type: string
 *           enum: [student, teacher]
 *         description: Filter by role in class
 *     responses:
 *       200:
 *         description: List of enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 */
router.get('/', authenticate, enrollmentController.getAll);

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Enrollment not found
 */
router.get('/:id', authenticate, enrollmentController.getById);

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - classId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               classId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               roleInClass:
 *                 type: string
 *                 enum: [student, teacher]
 *                 default: student
 *               status:
 *                 type: string
 *                 enum: [active, dropped, completed]
 *                 default: active
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Enrollment created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: User already enrolled or validation error
 *       403:
 *         description: Access denied
 */
router.post('/',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('userId').notEmpty(),
    body('classId').notEmpty(),
    body('roleInClass').optional().isIn(['student', 'teacher'])
  ],
  enrollmentController.create
);

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleInClass:
 *                 type: string
 *                 enum: [student, teacher]
 *               status:
 *                 type: string
 *                 enum: [active, dropped, completed]
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Enrollment not found
 *   delete:
 *     summary: Delete enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Enrollment not found
 */
router.put('/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('roleInClass').optional().isIn(['student', 'teacher']),
    body('status').optional().isIn(['active', 'dropped', 'completed'])
  ],
  enrollmentController.update
);
router.delete('/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  enrollmentController.remove
);

module.exports = router;
