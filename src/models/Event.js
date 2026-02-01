const mongoose = require('mongoose');

/**
 * Event Model
 * 
 * WHY: University-wide, department-wide, or class-specific events.
 * Scope determines visibility and access.
 */
const eventSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
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
  scope: {
    type: String,
    enum: ['university', 'department', 'class'],
    required: true
  },
  scopeId: {
    type: mongoose.Schema.Types.ObjectId,
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

eventSchema.index({ tenantId: 1, scope: 1, scopeId: 1 });
eventSchema.index({ tenantId: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
