const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Event Routes
 */

const eventValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('scope').isIn(['university', 'department', 'class']).withMessage('Invalid scope'),
    body('scopeId').optional().isMongoId().withMessage('Valid scope ID is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('description').optional().trim()
];

const idValidation = [param('id').isMongoId().withMessage('Valid event ID is required')];

router.get('/', authenticate, eventController.getEvents);
router.get('/:id', authenticate, idValidation, eventController.getEventById);
router.post('/', authenticate, requireRole(['admin', 'teacher']), eventValidation, eventController.createEvent);
router.put('/:id', authenticate, requireRole(['admin', 'teacher']), idValidation, eventController.updateEvent);
router.delete('/:id', authenticate, requireRole(['admin']), idValidation, eventController.deleteEvent);

module.exports = router;
