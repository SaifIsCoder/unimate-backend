const eventService = require('../services/eventService');
const { validationResult } = require('express-validator');

/**
 * Event Controller
 */

const getEvents = async (req, res, next) => {
    try {
        const filters = {
            scope: req.query.scope,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };
        const events = await eventService.getEvents(req.tenantId, req.user, filters);
        res.json({ success: true, data: events });
    } catch (error) {
        next(error);
    }
};

const getEventById = async (req, res, next) => {
    try {
        const event = await eventService.getEventById(req.tenantId, req.params.id);
        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

const createEvent = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const event = await eventService.createEvent(req.tenantId, req.user._id, req.body);
        res.status(201).json({ success: true, message: 'Event created successfully', data: event });
    } catch (error) {
        next(error);
    }
};

const updateEvent = async (req, res, next) => {
    try {
        const event = await eventService.updateEvent(req.tenantId, req.user._id, req.params.id, req.body);
        res.json({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
        next(error);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        const result = await eventService.deleteEvent(req.tenantId, req.user._id, req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
