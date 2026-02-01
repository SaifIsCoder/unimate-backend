const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const programController = require('../controllers/programController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Program Routes
 * 
 * WHY: RESTful endpoints for program (degree) management.
 * Admin and teacher roles can manage programs.
 */

/**
 * @swagger
 * /api/v1/programs:
 *   get:
 *     summary: Get all programs
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: List of programs
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
 *                     $ref: '#/components/schemas/Program'
 */
router.get('/', authenticate, programController.getAll);

/**
 * @swagger
 * /api/v1/programs/{id}:
 *   get:
 *     summary: Get program by ID
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       404:
 *         description: Program not found
 */
router.get('/:id', authenticate, programController.getById);

/**
 * @swagger
 * /api/v1/programs:
 *   post:
 *     summary: Create a new program
 *     tags: [Programs]
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
 *               - departmentId
 *               - cycleType
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bachelor of Science in Computer Science
 *               departmentId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               description:
 *                 type: string
 *               durationYears:
 *                 type: number
 *                 example: 4
 *               cycleType:
 *                 type: string
 *                 enum: [semester, trimester, annual]
 *                 example: semester
 *               totalCycles:
 *                 type: number
 *                 example: 8
 *               creditSystem:
 *                 type: string
 *                 enum: [credits, hours, units]
 *                 default: credits
 *     responses:
 *       201:
 *         description: Program created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Program'
 *       403:
 *         description: Access denied
 */
router.post('/',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('name').trim().notEmpty(),
    body('departmentId').notEmpty(),
    body('cycleType').isIn(['semester', 'trimester', 'annual'])
  ],
  programController.create
);

/**
 * @swagger
 * /api/v1/programs/{id}:
 *   put:
 *     summary: Update program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               cycleType:
 *                 type: string
 *                 enum: [semester, trimester, annual]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived]
 *     responses:
 *       200:
 *         description: Program updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Program not found
 *   delete:
 *     summary: Delete program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program deleted successfully
 *       403:
 *         description: Access denied - requires admin role
 *       404:
 *         description: Program not found
 */
router.put('/:id',
  authenticate,
  requireRole(['admin', 'teacher']),
  [
    body('name').optional().trim().notEmpty(),
    body('cycleType').optional().isIn(['semester', 'trimester', 'annual'])
  ],
  programController.update
);
router.delete('/:id',
  authenticate,
  requireRole(['admin']),
  programController.remove
);

module.exports = router;
