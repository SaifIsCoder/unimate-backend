const mongoose = require('mongoose');

/**
 * Class Model (CORE ENTITY)
 * 
 * WHY: Class is the operational unit of the system.
 * All academic activities (assignments, attendance, grades) are class-scoped.
 * Students and teachers access data through Enrollments, not direct class access.
 */
const classSchema = new mongoose.Schema({
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
  session: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['regular', 'self', 'evening', 'weekend'],
    default: 'regular'
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    default: 'morning'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

classSchema.index({ tenantId: 1, programId: 1 });
classSchema.index({ tenantId: 1, academicCycleId: 1 });
classSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Class', classSchema);
