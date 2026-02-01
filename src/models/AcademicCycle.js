const mongoose = require('mongoose');

/**
 * AcademicCycle Model (Semester/Term)
 * 
 * WHY: Represents a time period within a program (e.g., Fall 2024, Spring 2025).
 * Data-driven approach: cycles are created per program, not hardcoded.
 * Sequence number allows ordering (1, 2, 3...).
 */
const academicCycleSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  sequenceNumber: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

academicCycleSchema.index({ tenantId: 1, programId: 1, sequenceNumber: 1 });
academicCycleSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('AcademicCycle', academicCycleSchema);
