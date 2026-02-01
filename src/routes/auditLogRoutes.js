const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const auditLogController = require('../controllers/auditLogController');

/**
 * Audit Log Routes
 * 
 * WHY: Retrieve audit logs for compliance and monitoring.
 * All routes require admin authentication.
 */

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get all audit logs (admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (case-insensitive)
 *       - in: query
 *         name: entity
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., User, Class, Assignment)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter logs before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: List of audit logs
 *       403:
 *         description: Access denied (admin only)
 */
router.get('/', authenticate, auditLogController.getAuditLogs);

/**
 * @swagger
 * /api/v1/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics (admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Audit statistics
 *       403:
 *         description: Access denied (admin only)
 */
router.get('/stats', authenticate, auditLogController.getAuditStats);

/**
 * @swagger
 * /api/v1/audit-logs/{id}:
 *   get:
 *     summary: Get audit log by ID (admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audit log detail
 *       403:
 *         description: Access denied (admin only)
 *       404:
 *         description: Audit log not found
 */
router.get('/:id', authenticate, auditLogController.getAuditLogById);

/**
 * @swagger
 * /api/v1/audit-logs/user/{userId}:
 *   get:
 *     summary: Get audit logs by user (admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: User's audit logs
 *       403:
 *         description: Access denied (admin only)
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authenticate, auditLogController.getAuditLogsByUser);

/**
 * @swagger
 * /api/v1/audit-logs/entity/{entity}:
 *   get:
 *     summary: Get audit logs by entity (admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type (e.g., User, Class, Assignment)
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Optional entity ID to filter specific record
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *     responses:
 *       200:
 *         description: Entity's audit logs
 *       403:
 *         description: Access denied (admin only)
 */
router.get('/entity/:entity', authenticate, auditLogController.getAuditLogsByEntity);

module.exports = router;
