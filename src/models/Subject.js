const mongoose = require('mongoose');

/**
 * Subject Model
 * 
 * WHY: Represents a course/subject within a program and cycle.
 * Links to assignments and grades.
 */
const subjectSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  academicCycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicCycle',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  creditHours: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

subjectSchema.index({ tenantId: 1, programId: 1 });
subjectSchema.index({ tenantId: 1, academicCycleId: 1 });
subjectSchema.index({ tenantId: 1, code: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
