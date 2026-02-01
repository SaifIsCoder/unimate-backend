const mongoose = require('mongoose');

/**
 * AIRequestLog Model
 * 
 * WHY: Tracks AI feature usage for monitoring, billing, and optimization.
 * AI can only suggest, never modify core data - this log helps enforce that.
 */
const aiRequestLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feature: {
    type: String,
    required: true,
    trim: true
  },
  tokensUsed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  }
}, {
  timestamps: true
});

aiRequestLogSchema.index({ tenantId: 1, userId: 1 });
aiRequestLogSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('AIRequestLog', aiRequestLogSchema);
