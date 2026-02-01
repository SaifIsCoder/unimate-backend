const mongoose = require('mongoose');

/**
 * Submission Model
 * 
 * WHY: Student submissions for assignments.
 * Access controlled via Enrollment (student role required to submit).
 */
const submissionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String
  },
  content: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'late'],
    default: 'submitted'
  },
  marks: {
    type: Number,
    min: 0
  },
  feedback: {
    type: String,
    trim: true
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index: student can only submit once per assignment
submissionSchema.index({ tenantId: 1, assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ tenantId: 1, studentId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
