const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Class Routes
 * 
 * WHY: RESTful endpoints for class management.
 * Class is the core operational unit.
 * Access to class data must go through Enrollment middleware.
 */

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
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
 *         description: List of classes
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
 *                     $ref: '#/components/schemas/Class'
 */
router.get('/', authenticate, classController.getAll);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 */
router.get('/:id', authenticate, classController.getById);

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - programId
 *               - academicCycleId
 *               - session
 *               - capacity
 *             properties:
 *               programId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               academicCycleId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               session:
 *                 type: string
 *                 example: '2024-2025'
 *               type:
 *                 type: string
 *                 enum: [regular, self, evening, weekend]
 *                 default: regular
 *               shift:
 *                 type: string
 *                 enum: [morning, evening]
 *                 default: morning
 *               capacity:
 *                 type: number
 *                 example: 30
 *               status:
 *                 type: string
 *                 enum: [active, inactive, completed]
 *                 default: active
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       403:
 *         description: Access denied
 */
router.post('/',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('programId').notEmpty(),
    body('academicCycleId').notEmpty(),
    body('session').trim().notEmpty(),
    body('capacity').isInt({ min: 1 })
  ],
  classController.create
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   put:
 *     summary: Update class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [regular, self, evening, weekend]
 *               shift:
 *                 type: string
 *                 enum: [morning, evening]
 *               capacity:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive, completed]
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Class not found
 *   delete:
 *     summary: Delete class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       403:
 *         description: Access denied - requires admin role
 *       404:
 *         description: Class not found
 */
router.put('/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('capacity').optional().isInt({ min: 1 })
  ],
  classController.update
);
router.delete('/:id',
  authenticate,
  requireRole(['admin']),
  classController.remove
);

module.exports = router;
