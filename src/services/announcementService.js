// announcementService.js
// All announcement-related business logic is implemented here.

const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const Department = require('../models/Department');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get announcements based on user's access scope
 */
async function getAnnouncements(tenantId, user, filters = {}) {
    const query = { tenantId };

    if (filters.scope) query.scope = filters.scope;

    // If not admin, filter by visible announcements
    if (user.role !== 'admin') {
        const enrollments = await Enrollment.find({ tenantId, userId: user._id, status: 'active' });
        const classIds = enrollments.map(e => e.classId);

        query.$or = [
            { scope: 'university', scopeId: tenantId },
            { scope: 'department', scopeId: user.departmentId },
            { scope: 'class', scopeId: { $in: classIds } }
        ];
    }

    // Filter by expiry if applicable
    if (filters.active) {
        query.$or = [
            { expiresAt: { $gte: new Date() } },
            { expiresAt: null }
        ];
    }

    return Announcement.find(query)
        .populate('createdBy', 'profile.fullName')
        .sort({ createdAt: -1 });
}

/**
 * Get announcement by ID
 */
async function getAnnouncementById(tenantId, id) {
    const announcement = await Announcement.findOne({ _id: id, tenantId })
        .populate('createdBy', 'profile.fullName');

    if (!announcement) {
        throw new AppError('Announcement not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return announcement;
}

/**
 * Create announcement
 */
async function createAnnouncement(tenantId, userId, data) {
    // Validate scope
    if (data.scope === 'university') {
        data.scopeId = tenantId;
    } else if (data.scope === 'department') {
        const dept = await Department.findOne({ _id: data.scopeId, tenantId });
        if (!dept) throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const announcement = await Announcement.create({
        tenantId,
        ...data,
        createdBy: userId
    });

    await logAction({
        tenantId,
        userId,
        action: 'announcement_created',
        entity: 'Announcement',
        entityId: announcement._id
    });

    return announcement;
}

/**
 * Update announcement
 */
async function updateAnnouncement(tenantId, userId, id, data) {
    const announcement = await Announcement.findOneAndUpdate(
        { _id: id, tenantId },
        data,
        { new: true, runValidators: true }
    );

    if (!announcement) {
        throw new AppError('Announcement not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await logAction({
        tenantId,
        userId,
        action: 'announcement_updated',
        entity: 'Announcement',
        entityId: announcement._id
    });

    return announcement;
}

/**
 * Delete announcement
 */
async function deleteAnnouncement(tenantId, userId, id) {
    const announcement = await Announcement.findOne({ _id: id, tenantId });
    if (!announcement) {
        throw new AppError('Announcement not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await announcement.deleteOne();

    await logAction({
        tenantId,
        userId,
        action: 'announcement_deleted',
        entity: 'Announcement',
        entityId: id
    });

    return { message: 'Announcement deleted successfully' };
}

/**
 * Mark announcement as read
 */
async function markAsRead(tenantId, userId, id) {
    const announcement = await Announcement.findOne({ _id: id, tenantId });
    if (!announcement) {
        throw new AppError('Announcement not found', 404, ERROR_CODES.NOT_FOUND);
    }

    if (!announcement.readBy) {
        announcement.readBy = [];
    }

    if (!announcement.readBy.includes(userId)) {
        announcement.readBy.push(userId);
        await announcement.save();
    }

    return { message: 'Marked as read' };
}

module.exports = {
    getAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead
};
