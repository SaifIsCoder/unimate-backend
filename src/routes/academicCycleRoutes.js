const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const academicCycleController = require('../controllers/academicCycleController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * AcademicCycle Routes
 * 
 * WHY: RESTful endpoints for academic cycle (semester/term) management.
 * Data-driven approach - cycles are created per program.
 */

/**
 * @swagger
 * /api/v1/academic-cycles:
 *   get:
 *     summary: Get all academic cycles
 *     tags: [Academic Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programId
 *         schema:
 *           type: string
 *         description: Filter by program ID
 *     responses:
 *       200:
 *         description: List of academic cycles
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
 *                     $ref: '#/components/schemas/AcademicCycle'
 */
router.get('/', authenticate, academicCycleController.getAll);

/**
 * @swagger
 * /api/v1/academic-cycles/{id}:
 *   get:
 *     summary: Get academic cycle by ID
 *     tags: [Academic Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic cycle ID
 *     responses:
 *       200:
 *         description: Academic cycle details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AcademicCycle'
 *       404:
 *         description: Academic cycle not found
 */
router.get('/:id', authenticate, academicCycleController.getById);

/**
 * @swagger
 * /api/v1/academic-cycles:
 *   post:
 *     summary: Create a new academic cycle
 *     tags: [Academic Cycles]
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
 *               - programId
 *               - sequenceNumber
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Fall 2024
 *               programId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               sequenceNumber:
 *                 type: number
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-09-01T00:00:00.000Z'
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: '2024-12-31T23:59:59.999Z'
 *               status:
 *                 type: string
 *                 enum: [upcoming, active, completed, cancelled]
 *                 default: upcoming
 *     responses:
 *       201:
 *         description: Academic cycle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AcademicCycle'
 *       403:
 *         description: Access denied
 */
router.post('/',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('name').trim().notEmpty(),
    body('programId').notEmpty(),
    body('sequenceNumber').isInt({ min: 1 }),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  academicCycleController.create
);

/**
 * @swagger
 * /api/v1/academic-cycles/{id}:
 *   put:
 *     summary: Update academic cycle
 *     tags: [Academic Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sequenceNumber:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [upcoming, active, completed, cancelled]
 *     responses:
 *       200:
 *         description: Academic cycle updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Academic cycle not found
 *   delete:
 *     summary: Delete academic cycle
 *     tags: [Academic Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Academic cycle ID
 *     responses:
 *       200:
 *         description: Academic cycle deleted successfully
 *       403:
 *         description: Access denied - requires admin role
 *       404:
 *         description: Academic cycle not found
 */
router.put('/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('name').optional().trim().notEmpty(),
    body('sequenceNumber').optional().isInt({ min: 1 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601()
  ],
  academicCycleController.update
);
router.delete('/:id',
  authenticate,
  requireRole(['admin']),
  academicCycleController.remove
);

module.exports = router;
