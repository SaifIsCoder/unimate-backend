const mongoose = require('mongoose');

/**
 * User Model
 * 
 * WHY: Central user entity with tenant isolation.
 * Email is unique per tenant (not globally) to allow same email across universities.
 * Role determines access level across the system.
 */
const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'pending'],
    default: 'pending'
  },
  profile: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatarUrl: {
      type: String
    }
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index: email must be unique per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
