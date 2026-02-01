// feeService.js
// All fee-related business logic is implemented here.

const Fee = require('../models/Fee');
const Fine = require('../models/Fine');
const Enrollment = require('../models/Enrollment');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get all fees with filters
 */
async function getAllFees(tenantId, filters = {}) {
    const query = { tenantId };
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.classId) query.classId = filters.classId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    return Fee.find(query)
        .populate('studentId', 'profile.fullName email')
        .populate('classId', 'name')
        .sort({ dueDate: 1 });
}

/**
 * Get student's fees
 */
async function getStudentFees(tenantId, studentId) {
    return Fee.find({ tenantId, studentId })
        .populate('classId', 'name')
        .sort({ dueDate: 1 });
}

/**
 * Get fee by ID
 */
async function getFeeById(tenantId, id) {
    const fee = await Fee.findOne({ _id: id, tenantId })
        .populate('studentId', 'profile.fullName email')
        .populate('classId', 'name');

    if (!fee) {
        throw new AppError('Fee not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return fee;
}

/**
 * Create fee
 */
async function createFee(tenantId, userId, data) {
    // Validate student enrollment
    const enrollment = await Enrollment.findOne({
        tenantId,
        userId: data.studentId,
        classId: data.classId,
        status: 'active'
    });

    if (!enrollment) {
        throw new AppError('Student is not enrolled in this class', 400, ERROR_CODES.NOT_ENROLLED);
    }

    const fee = await Fee.create({
        tenantId,
        ...data
    });

    await logAction({
        tenantId,
        userId,
        action: 'fee_created',
        entity: 'Fee',
        entityId: fee._id
    });

    return fee;
}

/**
 * Update fee
 */
async function updateFee(tenantId, userId, id, data) {
    const fee = await Fee.findOneAndUpdate(
        { _id: id, tenantId },
        data,
        { new: true, runValidators: true }
    );

    if (!fee) {
        throw new AppError('Fee not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await logAction({
        tenantId,
        userId,
        action: 'fee_updated',
        entity: 'Fee',
        entityId: fee._id
    });

    return fee;
}

/**
 * Pay fee
 */
async function payFee(tenantId, userId, id, paymentInfo) {
    const fee = await Fee.findOne({ _id: id, tenantId });
    if (!fee) {
        throw new AppError('Fee not found', 404, ERROR_CODES.NOT_FOUND);
    }

    if (fee.status === 'paid') {
        throw new AppError('Fee is already paid', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    fee.status = 'paid';
    fee.paidAt = new Date();
    fee.paymentReference = paymentInfo.reference;
    await fee.save();

    await logAction({
        tenantId,
        userId,
        action: 'fee_paid',
        entity: 'Fee',
        entityId: fee._id
    });

    return fee;
}

/**
 * Waive fee (admin only)
 */
async function waiveFee(tenantId, userId, id, reason) {
    const fee = await Fee.findOne({ _id: id, tenantId });
    if (!fee) {
        throw new AppError('Fee not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = fee.status;
    fee.status = 'waived';
    fee.waivedReason = reason;
    fee.waivedAt = new Date();
    await fee.save();

    await logAction({
        tenantId,
        userId,
        action: 'fee_waived',
        entity: 'Fee',
        entityId: fee._id,
        before: { status: oldStatus },
        after: { status: 'waived', reason }
    });

    return fee;
}

/**
 * Delete fee
 */
async function deleteFee(tenantId, userId, id) {
    const fee = await Fee.findOne({ _id: id, tenantId });
    if (!fee) {
        throw new AppError('Fee not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await fee.deleteOne();

    await logAction({
        tenantId,
        userId,
        action: 'fee_deleted',
        entity: 'Fee',
        entityId: id
    });

    return { message: 'Fee deleted successfully' };
}

// ============ FINES ============

/**
 * Get all fines
 */
async function getAllFines(tenantId, filters = {}) {
    const query = { tenantId };
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;

    return Fine.find(query)
        .populate('studentId', 'profile.fullName email')
        .sort({ createdAt: -1 });
}

/**
 * Get student's fines
 */
async function getStudentFines(tenantId, studentId) {
    return Fine.find({ tenantId, studentId }).sort({ createdAt: -1 });
}

/**
 * Get fine by ID
 */
async function getFineById(tenantId, id) {
    const fine = await Fine.findOne({ _id: id, tenantId })
        .populate('studentId', 'profile.fullName email');

    if (!fine) {
        throw new AppError('Fine not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return fine;
}

/**
 * Create fine
 */
async function createFine(tenantId, userId, data) {
    const fine = await Fine.create({
        tenantId,
        ...data,
        issuedBy: userId
    });

    await logAction({
        tenantId,
        userId,
        action: 'fine_created',
        entity: 'Fine',
        entityId: fine._id
    });

    return fine;
}

/**
 * Pay fine
 */
async function payFine(tenantId, userId, id, paymentInfo) {
    const fine = await Fine.findOne({ _id: id, tenantId });
    if (!fine) {
        throw new AppError('Fine not found', 404, ERROR_CODES.NOT_FOUND);
    }

    if (fine.status === 'paid') {
        throw new AppError('Fine is already paid', 400, ERROR_CODES.VALIDATION_ERROR);
    }

    fine.status = 'paid';
    fine.paidAt = new Date();
    fine.paymentReference = paymentInfo.reference;
    await fine.save();

    await logAction({
        tenantId,
        userId,
        action: 'fine_paid',
        entity: 'Fine',
        entityId: fine._id
    });

    return fine;
}

/**
 * Waive fine (admin only)
 */
async function waiveFine(tenantId, userId, id, reason) {
    const fine = await Fine.findOne({ _id: id, tenantId });
    if (!fine) {
        throw new AppError('Fine not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = fine.status;
    fine.status = 'waived';
    fine.waivedReason = reason;
    fine.waivedAt = new Date();
    await fine.save();

    await logAction({
        tenantId,
        userId,
        action: 'fine_waived',
        entity: 'Fine',
        entityId: fine._id,
        before: { status: oldStatus },
        after: { status: 'waived', reason }
    });

    return fine;
}

/**
 * Delete fine
 */
async function deleteFine(tenantId, userId, id) {
    const fine = await Fine.findOne({ _id: id, tenantId });
    if (!fine) {
        throw new AppError('Fine not found', 404, ERROR_CODES.NOT_FOUND);
    }

    await fine.deleteOne();

    await logAction({
        tenantId,
        userId,
        action: 'fine_deleted',
        entity: 'Fine',
        entityId: id
    });

    return { message: 'Fine deleted successfully' };
}

/**
 * Get fee summary for a student
 */
async function getStudentFinancialSummary(tenantId, studentId) {
    const fees = await Fee.find({ tenantId, studentId });
    const fines = await Fine.find({ tenantId, studentId });

    const feeSummary = {
        total: fees.reduce((sum, f) => sum + f.amount, 0),
        paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
        pending: fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
        overdue: fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0),
        waived: fees.filter(f => f.status === 'waived').reduce((sum, f) => sum + f.amount, 0)
    };

    const fineSummary = {
        total: fines.reduce((sum, f) => sum + f.amount, 0),
        paid: fines.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
        pending: fines.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
        waived: fines.filter(f => f.status === 'waived').reduce((sum, f) => sum + f.amount, 0)
    };

    return {
        fees: feeSummary,
        fines: fineSummary,
        totalOwed: feeSummary.pending + feeSummary.overdue + fineSummary.pending
    };
}

module.exports = {
    getAllFees,
    getStudentFees,
    getFeeById,
    createFee,
    updateFee,
    payFee,
    waiveFee,
    deleteFee,
    getAllFines,
    getStudentFines,
    getFineById,
    createFine,
    payFine,
    waiveFine,
    deleteFine,
    getStudentFinancialSummary
};
