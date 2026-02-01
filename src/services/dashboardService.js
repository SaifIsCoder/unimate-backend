// dashboardService.js
// Aggregates dashboard metrics for the UniMate backend.
// All queries are tenant-scoped and permission-based.

const User = require('../models/User');
const Program = require('../models/Program');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const AcademicCycle = require('../models/AcademicCycle');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

async function getDashboardData(tenantId, user) {
  // Permission check: only admins, department admins, teachers
  if (!['admin', 'superadmin', 'universityadmin', 'departmentadmin', 'teacher'].includes(user.role)) {
    throw new Error('Unauthorized');
  }

  // Aggregate metrics
  const [userCount, programCount, departmentCount, classCount, enrollmentCount, cycleCount, assignmentCount, submissionCount, attendanceCount, auditLogCount] = await Promise.all([
    User.countDocuments({ tenantId }),
    Program.countDocuments({ tenantId }),
    Department.countDocuments({ tenantId }),
    Class.countDocuments({ tenantId }),
    Enrollment.countDocuments({ tenantId }),
    AcademicCycle.countDocuments({ tenantId }),
    Assignment.countDocuments({ tenantId }),
    Submission.countDocuments({ tenantId }),
    Attendance.countDocuments({ tenantId }),
    AuditLog.countDocuments({ tenantId })
  ]);

  return {
    users: userCount,
    programs: programCount,
    departments: departmentCount,
    classes: classCount,
    enrollments: enrollmentCount,
    academicCycles: cycleCount,
    assignments: assignmentCount,
    submissions: submissionCount,
    attendanceRecords: attendanceCount,
    auditLogs: auditLogCount
  };
}

module.exports = {
  getDashboardData
};
