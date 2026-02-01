const mongoose = require('mongoose');

/**
 * Grade Model
 * 
 * WHY: Student grades for subjects within classes.
 * Access controlled via Enrollment.
 */
const gradeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gradedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

gradeSchema.index({ tenantId: 1, classId: 1 });
gradeSchema.index({ tenantId: 1, studentId: 1 });
gradeSchema.index({ tenantId: 1, subjectId: 1 });

module.exports = mongoose.model('Grade', gradeSchema);
