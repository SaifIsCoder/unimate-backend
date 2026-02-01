const mongoose = require('mongoose');

/**
 * Program Model (Degree)
 * 
 * WHY: Represents a degree program (e.g., BSc Computer Science).
 * Links to department and defines cycle structure (semester/trimester).
 * Academic structure is data-driven, not hardcoded.
 */
const programSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  durationYears: {
    type: Number
  },
  cycleType: {
    type: String,
    enum: ['semester', 'trimester', 'annual'],
    required: true,
    default: 'semester'
  },
  totalCycles: {
    type: Number
  },
  creditSystem: {
    type: String,
    enum: ['credits', 'hours', 'units'],
    default: 'credits'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

programSchema.index({ tenantId: 1, departmentId: 1 });
programSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Program', programSchema);
