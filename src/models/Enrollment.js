const mongoose = require('mongoose');

/**
 * Enrollment Model (SECURITY CORE)
 * 
 * WHY: This is the ONLY way users can access class data.
 * Never trust direct class access - always verify enrollment exists.
 * Role in class (student/teacher) determines what actions are allowed.
 * This enforces class-scoped access control.
 */
const enrollmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  roleInClass: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index: user can only have one enrollment per class
enrollmentSchema.index({ tenantId: 1, userId: 1, classId: 1 }, { unique: true });
enrollmentSchema.index({ tenantId: 1, classId: 1, roleInClass: 1 });
enrollmentSchema.index({ tenantId: 1, userId: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
