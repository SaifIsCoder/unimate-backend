const announcementService = require('../services/announcementService');
const { validationResult } = require('express-validator');

/**
 * Announcement Controller
 */

const getAnnouncements = async (req, res, next) => {
    try {
        const filters = {
            scope: req.query.scope,
            active: req.query.active === 'true'
        };
        const announcements = await announcementService.getAnnouncements(req.tenantId, req.user, filters);
        res.json({ success: true, data: announcements });
    } catch (error) {
        next(error);
    }
};

const getAnnouncementById = async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.tenantId, req.params.id);
        res.json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

const createAnnouncement = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const announcement = await announcementService.createAnnouncement(req.tenantId, req.user._id, req.body);
        res.status(201).json({ success: true, message: 'Announcement created successfully', data: announcement });
    } catch (error) {
        next(error);
    }
};

const updateAnnouncement = async (req, res, next) => {
    try {
        const announcement = await announcementService.updateAnnouncement(req.tenantId, req.user._id, req.params.id, req.body);
        res.json({ success: true, message: 'Announcement updated successfully', data: announcement });
    } catch (error) {
        next(error);
    }
};

const deleteAnnouncement = async (req, res, next) => {
    try {
        const result = await announcementService.deleteAnnouncement(req.tenantId, req.user._id, req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const result = await announcementService.markAsRead(req.tenantId, req.user._id, req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead
};
