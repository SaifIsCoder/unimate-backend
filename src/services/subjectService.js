// subjectService.js
// All subject-related business logic is implemented here.
// Controllers must not contain business logic.

const Subject = require('../models/Subject');
const Program = require('../models/Program');
const AcademicCycle = require('../models/AcademicCycle');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get all subjects for a tenant with optional filters
 */
async function getAllSubjects(tenantId, filters = {}) {
    const query = { tenantId };
    if (filters.programId) query.programId = filters.programId;
    if (filters.academicCycleId) query.academicCycleId = filters.academicCycleId;
    if (filters.type) query.type = filters.type;

    return Subject.find(query)
        .populate('programId', 'name code')
        .populate('academicCycleId', 'name')
        .sort({ code: 1 });
}

/**
 * Get a single subject by ID
 */
async function getSubjectById(tenantId, id) {
    const subject = await Subject.findOne({ _id: id, tenantId })
        .populate('programId', 'name code')
        .populate('academicCycleId', 'name startDate endDate');

    if (!subject) {
        throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return subject;
}

/**
 * Create a new subject
 */
async function createSubject(tenantId, userId, data) {
    // Validate program exists
    const program = await Program.findOne({ _id: data.programId, tenantId });
    if (!program) {
        throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Validate academic cycle exists
    const cycle = await AcademicCycle.findOne({ _id: data.academicCycleId, tenantId });
    if (!cycle) {
        throw new AppError('Academic cycle not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Check for duplicate subject code within tenant
    const existing = await Subject.findOne({
        tenantId,
        code: data.code.toUpperCase(),
        programId: data.programId,
        academicCycleId: data.academicCycleId
    });
    if (existing) {
        throw new AppError('Subject with this code already exists in this program/cycle', 400, ERROR_CODES.DUPLICATE);
    }

    const subject = await Subject.create({
        tenantId,
        ...data,
        code: data.code.toUpperCase()
    });

    await logAction({
        tenantId,
        userId,
        action: 'subject_created',
        entity: 'Subject',
        entityId: subject._id
    });

    return subject;
}

/**
 * Update a subject
 */
async function updateSubject(tenantId, userId, id, data) {
    // Validate program if provided
    if (data.programId) {
        const program = await Program.findOne({ _id: data.programId, tenantId });
        if (!program) {
            throw new AppError('Program not found', 404, ERROR_CODES.NOT_FOUND);
        }
    }

    // Validate academic cycle if provided
    if (data.academicCycleId) {
        const cycle = await AcademicCycle.findOne({ _id: data.academicCycleId, tenantId });
        if (!cycle) {
            throw new AppError('Academic cycle not found', 404, ERROR_CODES.NOT_FOUND);
        }
    }

    // If code is being updated, check for duplicates
    if (data.code) {
        const subject = await Subject.findById(id);
        const existing = await Subject.findOne({
            tenantId,
            code: data.code.toUpperCase(),
            programId: data.programId || subject.programId,
            academicCycleId: data.academicCycleId || subject.academicCycleId,
            _id: { $ne: id }
        });
        if (existing) {
            throw new AppError('Subject with this code already exists', 400, ERROR_CODES.DUPLICATE);
        }
        data.code = data.code.toUpperCase();
    }

    const subject = await Subject.findOneAndUpdate(
        { _id: id, tenantId },
        data,
        { new: true, runValidators: true }
    );

    if (!subject) {
        throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await logAction({
        tenantId,
        userId,
        action: 'subject_updated',
        entity: 'Subject',
        entityId: subject._id
    });

    return subject;
}

/**
 * Delete a subject (soft delete)
 */
async function deleteSubject(tenantId, userId, id) {
    const subject = await Subject.findOne({ _id: id, tenantId });
    if (!subject) {
        throw new AppError('Subject not found', 404, ERROR_CODES.NOT_FOUND);
    }

    subject.deletedAt = new Date();
    await subject.save();

    await logAction({
        tenantId,
        userId,
        action: 'subject_deleted',
        entity: 'Subject',
        entityId: subject._id
    });

    return { message: 'Subject deleted successfully' };
}

module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
