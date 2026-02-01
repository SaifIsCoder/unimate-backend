const mongoose = require('mongoose');

/**
 * Announcement Model
 * 
 * WHY: System-wide, department-wide, or class-specific announcements.
 * Scope determines who can see the announcement.
 */
const announcementSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

announcementSchema.index({ tenantId: 1, scope: 1, scopeId: 1 });
announcementSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
