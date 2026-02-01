const mongoose = require('mongoose');

/**
 * Tenant Model (University)
 * 
 * WHY: This is the root entity for multi-tenancy.
 * Every other collection references tenantId for data isolation.
 */
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'archived'],
    default: 'active'
  },
  settings: {
    gradingSystem: {
      type: String,
      enum: ['percentage', 'gpa', 'letter'],
      default: 'percentage'
    },
    cycleNaming: {
      type: String,
      enum: ['semester', 'trimester', 'term', 'quarter'],
      default: 'semester'
    },
    attendancePolicy: {
      minimumPercentage: {
        type: Number,
        default: 75
      }
    }
  }
}, {
  timestamps: true
});

// Index for faster lookups
tenantSchema.index({ code: 1 });
tenantSchema.index({ status: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
