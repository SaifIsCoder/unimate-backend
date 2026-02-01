const feeService = require('../services/feeService');
const { validationResult } = require('express-validator');

/**
 * Fee Controller
 */

// ============ FEES ============

const getAllFees = async (req, res, next) => {
    try {
        const filters = {
            studentId: req.query.studentId,
            classId: req.query.classId,
            status: req.query.status,
            type: req.query.type
        };
        const fees = await feeService.getAllFees(req.tenantId, filters);
        res.json({ success: true, data: fees });
    } catch (error) {
        next(error);
    }
};

const getMyFees = async (req, res, next) => {
    try {
        const fees = await feeService.getStudentFees(req.tenantId, req.user._id);
        res.json({ success: true, data: fees });
    } catch (error) {
        next(error);
    }
};

const getFeeById = async (req, res, next) => {
    try {
        const fee = await feeService.getFeeById(req.tenantId, req.params.id);
        res.json({ success: true, data: fee });
    } catch (error) {
        next(error);
    }
};

const createFee = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const fee = await feeService.createFee(req.tenantId, req.user._id, req.body);
        res.status(201).json({ success: true, message: 'Fee created successfully', data: fee });
    } catch (error) {
        next(error);
    }
};

const updateFee = async (req, res, next) => {
    try {
        const fee = await feeService.updateFee(req.tenantId, req.user._id, req.params.id, req.body);
        res.json({ success: true, message: 'Fee updated successfully', data: fee });
    } catch (error) {
        next(error);
    }
};

const payFee = async (req, res, next) => {
    try {
        const fee = await feeService.payFee(req.tenantId, req.user._id, req.params.id, req.body);
        res.json({ success: true, message: 'Fee paid successfully', data: fee });
    } catch (error) {
        next(error);
    }
};

const waiveFee = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const fee = await feeService.waiveFee(req.tenantId, req.user._id, req.params.id, reason);
        res.json({ success: true, message: 'Fee waived successfully', data: fee });
    } catch (error) {
        next(error);
    }
};

const deleteFee = async (req, res, next) => {
    try {
        const result = await feeService.deleteFee(req.tenantId, req.user._id, req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

// ============ FINES ============

const getAllFines = async (req, res, next) => {
    try {
        const filters = {
            studentId: req.query.studentId,
            status: req.query.status,
            type: req.query.type
        };
        const fines = await feeService.getAllFines(req.tenantId, filters);
        res.json({ success: true, data: fines });
    } catch (error) {
        next(error);
    }
};

const getMyFines = async (req, res, next) => {
    try {
        const fines = await feeService.getStudentFines(req.tenantId, req.user._id);
        res.json({ success: true, data: fines });
    } catch (error) {
        next(error);
    }
};

const getFineById = async (req, res, next) => {
    try {
        const fine = await feeService.getFineById(req.tenantId, req.params.id);
        res.json({ success: true, data: fine });
    } catch (error) {
        next(error);
    }
};

const createFine = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const fine = await feeService.createFine(req.tenantId, req.user._id, req.body);
        res.status(201).json({ success: true, message: 'Fine created successfully', data: fine });
    } catch (error) {
        next(error);
    }
};

const payFine = async (req, res, next) => {
    try {
        const fine = await feeService.payFine(req.tenantId, req.user._id, req.params.id, req.body);
        res.json({ success: true, message: 'Fine paid successfully', data: fine });
    } catch (error) {
        next(error);
    }
};

const waiveFine = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const fine = await feeService.waiveFine(req.tenantId, req.user._id, req.params.id, reason);
        res.json({ success: true, message: 'Fine waived successfully', data: fine });
    } catch (error) {
        next(error);
    }
};

const deleteFine = async (req, res, next) => {
    try {
        const result = await feeService.deleteFine(req.tenantId, req.user._id, req.params.id);
        res.json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

const getMyFinancialSummary = async (req, res, next) => {
    try {
        const summary = await feeService.getStudentFinancialSummary(req.tenantId, req.user._id);
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

const getStudentFinancialSummary = async (req, res, next) => {
    try {
        const summary = await feeService.getStudentFinancialSummary(req.tenantId, req.params.studentId);
        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllFees,
    getMyFees,
    getFeeById,
    createFee,
    updateFee,
    payFee,
    waiveFee,
    deleteFee,
    getAllFines,
    getMyFines,
    getFineById,
    createFine,
    payFine,
    waiveFine,
    deleteFine,
    getMyFinancialSummary,
    getStudentFinancialSummary
};
