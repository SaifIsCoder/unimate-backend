const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Announcement Routes
 */

const announcementValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('scope').isIn(['university', 'department', 'class']).withMessage('Invalid scope'),
    body('scopeId').optional().isMongoId().withMessage('Valid scope ID is required'),
    body('expiresAt').optional().isISO8601().withMessage('Valid expiry date is required')
];

const idValidation = [param('id').isMongoId().withMessage('Valid announcement ID is required')];

router.get('/', authenticate, announcementController.getAnnouncements);
router.get('/:id', authenticate, idValidation, announcementController.getAnnouncementById);
router.post('/', authenticate, requireRole(['admin', 'teacher']), announcementValidation, announcementController.createAnnouncement);
router.put('/:id', authenticate, requireRole(['admin', 'teacher']), idValidation, announcementController.updateAnnouncement);
router.delete('/:id', authenticate, requireRole(['admin']), idValidation, announcementController.deleteAnnouncement);
router.patch('/:id/read', authenticate, idValidation, announcementController.markAsRead);

module.exports = router;
