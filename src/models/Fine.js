const mongoose = require('mongoose');

/**
 * Fine Model
 * 
 * WHY: Student fines for violations (late fees, library fines, etc.).
 * Separate from regular fees for better tracking.
 */
const fineSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'waived'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['attendance', 'late_submission', 'library', 'manual'],
    default: 'manual'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: {
    type: Date
  },
  paymentReference: {
    type: String
  },
  waivedAt: {
    type: Date
  },
  waivedReason: {
    type: String
  }
}, {
  timestamps: true
});

fineSchema.index({ tenantId: 1, studentId: 1 });
fineSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Fine', fineSchema);
