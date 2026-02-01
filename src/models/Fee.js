const mongoose = require('mongoose');

/**
 * Fee Model
 * 
 * WHY: Student fees linked to classes.
 * Financial records are tenant-scoped.
 */
const feeSchema = new mongoose.Schema({
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
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  type: {
    type: String,
    enum: ['tuition', 'registration', 'lab', 'library', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'waived'],
    default: 'pending'
  }
}, {
  timestamps: true
});

feeSchema.index({ tenantId: 1, studentId: 1 });
feeSchema.index({ tenantId: 1, classId: 1 });
feeSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Fee', feeSchema);
