const mongoose = require('mongoose');
const { addSoftDelete } = require('../utils/softDelete');

/**
 * Department Model
 * 
 * WHY: Organizational unit within a university.
 * Groups related programs and provides structure.
 * Soft delete preserves data integrity.
 */
const departmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
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
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Add soft delete support
addSoftDelete(departmentSchema);

// Compound index: code should be unique per tenant (excluding deleted)
departmentSchema.index({ tenantId: 1, code: 1, deletedAt: 1 }, { 
  unique: true,
  partialFilterExpression: { deletedAt: null }
});

module.exports = mongoose.model('Department', departmentSchema);
