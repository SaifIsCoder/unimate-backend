const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const feeController = require('../controllers/feeController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

/**
 * Fee and Fine Routes
 */

// Fee validation
const feeValidation = [
    body('studentId').isMongoId().withMessage('Valid student ID is required'),
    body('classId').isMongoId().withMessage('Valid class ID is required'),
    body('type').isIn(['tuition', 'registration', 'lab', 'library', 'other']).withMessage('Invalid fee type'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('dueDate').isISO8601().withMessage('Valid due date is required')
];

// Fine validation
const fineValidation = [
    body('studentId').isMongoId().withMessage('Valid student ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('type').optional().isIn(['attendance', 'late_submission', 'library', 'manual']).withMessage('Invalid fine type')
];

const idValidation = [param('id').isMongoId().withMessage('Valid ID is required')];

// ============ FEE ROUTES ============

router.get('/my', authenticate, feeController.getMyFees);
router.get('/my/summary', authenticate, feeController.getMyFinancialSummary);
router.get('/', authenticate, requireRole(['admin']), feeController.getAllFees);
router.get('/student/:studentId/summary', authenticate, requireRole(['admin']), feeController.getStudentFinancialSummary);
router.get('/:id', authenticate, idValidation, feeController.getFeeById);

router.post('/', authenticate, requireRole(['admin']), feeValidation, feeController.createFee);
router.put('/:id', authenticate, requireRole(['admin']), idValidation, feeController.updateFee);
router.patch('/:id/pay', authenticate, idValidation, feeController.payFee);
router.patch('/:id/waive', authenticate, requireRole(['admin']), idValidation, feeController.waiveFee);
router.delete('/:id', authenticate, requireRole(['admin']), idValidation, feeController.deleteFee);

// ============ FINE ROUTES ============

router.get('/fines/my', authenticate, feeController.getMyFines);
router.get('/fines', authenticate, requireRole(['admin']), feeController.getAllFines);
router.get('/fines/:id', authenticate, idValidation, feeController.getFineById);

router.post('/fines', authenticate, requireRole(['admin']), fineValidation, feeController.createFine);
router.patch('/fines/:id/pay', authenticate, idValidation, feeController.payFine);
router.patch('/fines/:id/waive', authenticate, requireRole(['admin']), idValidation, feeController.waiveFine);
router.delete('/fines/:id', authenticate, requireRole(['admin']), idValidation, feeController.deleteFine);

module.exports = router;
