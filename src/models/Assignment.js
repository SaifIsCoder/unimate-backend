const mongoose = require('mongoose');

/**
 * Assignment Model
 * 
 * WHY: Class-scoped assignments created by teachers.
 * Access controlled via Enrollment (teacher role required to create).
 */
const assignmentSchema = new mongoose.Schema({
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
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

assignmentSchema.index({ tenantId: 1, classId: 1 });
assignmentSchema.index({ tenantId: 1, subjectId: 1 });
assignmentSchema.index({ tenantId: 1, createdBy: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
