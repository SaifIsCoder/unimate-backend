const mongoose = require('mongoose');

/**
 * Attendance Model
 * 
 * WHY: Class-scoped attendance records.
 * Teachers mark attendance for their enrolled classes.
 */
const attendanceSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  records: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true
    }
  }]
}, {
  timestamps: true
});

// Compound index: one attendance record per class per date
attendanceSchema.index({ tenantId: 1, classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, classId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
