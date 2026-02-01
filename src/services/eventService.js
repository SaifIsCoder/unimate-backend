// eventService.js
// All event-related business logic is implemented here.

const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');
const Department = require('../models/Department');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get events based on user's access scope
 */
async function getEvents(tenantId, user, filters = {}) {
    const query = { tenantId };

    if (filters.scope) query.scope = filters.scope;
    if (filters.startDate && filters.endDate) {
        query.startDate = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }

    // If not admin, filter by visible events
    if (user.role !== 'admin') {
        const enrollments = await Enrollment.find({ tenantId, userId: user._id, status: 'active' });
        const classIds = enrollments.map(e => e.classId);

        query.$or = [
            { scope: 'university', scopeId: tenantId },
            { scope: 'department', scopeId: user.departmentId },
            { scope: 'class', scopeId: { $in: classIds } }
        ];
    }

    return Event.find(query).sort({ startDate: 1 });
}

/**
 * Get event by ID
 */
async function getEventById(tenantId, id) {
    const event = await Event.findOne({ _id: id, tenantId });
    if (!event) {
        throw new AppError('Event not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return event;
}

/**
 * Create event
 */
async function createEvent(tenantId, userId, data) {
    // Validate scope
    if (data.scope === 'university') {
        data.scopeId = tenantId;
    } else if (data.scope === 'department') {
        const dept = await Department.findOne({ _id: data.scopeId, tenantId });
        if (!dept) throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const event = await Event.create({
        tenantId,
        ...data,
        createdBy: userId
    });

    await logAction({
        tenantId,
        userId,
        action: 'event_created',
        entity: 'Event',
        entityId: event._id
    });

    return event;
}

/**
 * Update event
 */
async function updateEvent(tenantId, userId, id, data) {
    const event = await Event.findOneAndUpdate(
        { _id: id, tenantId },
        data,
        { new: true, runValidators: true }
    );

    if (!event) {
        throw new AppError('Event not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await logAction({
        tenantId,
        userId,
        action: 'event_updated',
        entity: 'Event',
        entityId: event._id
    });

    return event;
}

/**
 * Delete event
 */
async function deleteEvent(tenantId, userId, id) {
    const event = await Event.findOne({ _id: id, tenantId });
    if (!event) {
        throw new AppError('Event not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await event.deleteOne();

    await logAction({
        tenantId,
        userId,
        action: 'event_deleted',
        entity: 'Event',
        entityId: id
    });

    return { message: 'Event deleted successfully' };
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
