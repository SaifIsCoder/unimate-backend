// attendanceService.js
// All attendance-related business logic is implemented here.
// Controllers must not contain business logic.

const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const { logAction } = require('../utils/auditLogger');
const { AppError, ERROR_CODES } = require('../utils/errors');

/**
 * Get attendance records for a class with optional date filtering
 */
async function getAttendanceByClass(tenantId, classId, filters = {}) {
    const query = { tenantId, classId };

    if (filters.startDate && filters.endDate) {
        query.date = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    } else if (filters.date) {
        const date = new Date(filters.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    return Attendance.find(query)
        .populate('records.studentId', 'email profile.fullName')
        .sort({ date: -1 });
}

/**
 * Get attendance record by ID
 */
async function getAttendanceById(tenantId, id) {
    const attendance = await Attendance.findOne({ _id: id, tenantId })
        .populate('classId', 'name')
        .populate('records.studentId', 'email profile.fullName');

    if (!attendance) {
        throw new AppError('Attendance record not found', 404, ERROR_CODES.NOT_FOUND);
    }
    return attendance;
}

/**
 * Get attendance for a specific student
 */
async function getStudentAttendance(tenantId, studentId, filters = {}) {
    const query = { tenantId, 'records.studentId': studentId };

    if (filters.classId) query.classId = filters.classId;
    if (filters.startDate && filters.endDate) {
        query.date = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    const attendances = await Attendance.find(query)
        .populate('classId', 'name')
        .sort({ date: -1 });

    // Extract only the student's records
    return attendances.map(att => ({
        _id: att._id,
        classId: att.classId,
        date: att.date,
        record: att.records.find(r => r.studentId.toString() === studentId.toString())
    }));
}

/**
 * Mark attendance for a class (teacher action)
 */
async function markAttendance(tenantId, userId, classId, date, records) {
    // Validate class exists
    const classDoc = await Class.findOne({ _id: classId, tenantId });
    if (!classDoc) {
        throw new AppError('Class not found', 404, ERROR_CODES.NOT_FOUND);
    }

    // Validate all students are enrolled
    const studentIds = records.map(r => r.studentId);
    const enrollments = await Enrollment.find({
        tenantId,
        classId,
        userId: { $in: studentIds },
        status: 'active'
    });

    const enrolledStudentIds = enrollments.map(e => e.userId.toString());
    const invalidStudents = studentIds.filter(id => !enrolledStudentIds.includes(id.toString()));

    if (invalidStudents.length > 0) {
        throw new AppError(
            `Some students are not enrolled in this class`,
            400,
            ERROR_CODES.VALIDATION_ERROR,
            { invalidStudents }
        );
    }

    // Create date for start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this class/date
    let attendance = await Attendance.findOne({
        tenantId,
        classId,
        date: attendanceDate
    });

    if (attendance) {
        // Update existing attendance
        attendance.records = records;
        await attendance.save();

        await logAction({
            tenantId,
            userId,
            action: 'attendance_updated',
            entity: 'Attendance',
            entityId: attendance._id
        });
    } else {
        // Create new attendance record
        attendance = await Attendance.create({
            tenantId,
            classId,
            date: attendanceDate,
            records
        });

        await logAction({
            tenantId,
            userId,
            action: 'attendance_marked',
            entity: 'Attendance',
            entityId: attendance._id
        });
    }

    return attendance;
}

/**
 * Override a student's attendance (admin action)
 */
async function overrideAttendance(tenantId, userId, attendanceId, studentId, newStatus, reason) {
    const attendance = await Attendance.findOne({ _id: attendanceId, tenantId });
    if (!attendance) {
        throw new AppError('Attendance record not found', 404, ERROR_CODES.NOT_FOUND);
    }

    const recordIndex = attendance.records.findIndex(
        r => r.studentId.toString() === studentId.toString()
    );

    if (recordIndex === -1) {
        throw new AppError('Student record not found in this attendance', 404, ERROR_CODES.NOT_FOUND);
    }

    const oldStatus = attendance.records[recordIndex].status;
    attendance.records[recordIndex].status = newStatus;
    await attendance.save();

    // Log override with before/after snapshot
    await logAction({
        tenantId,
        userId,
        action: 'attendance_override',
        entity: 'Attendance',
        entityId: attendance._id,
        before: { studentId, status: oldStatus },
        after: { studentId, status: newStatus, reason }
    });

    return attendance;
}

/**
 * Get attendance summary/report for a class
 */
async function getAttendanceReport(tenantId, classId, startDate, endDate) {
    const query = {
        tenantId,
        classId,
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    const attendances = await Attendance.find(query).populate('records.studentId', 'profile.fullName');

    // Calculate summary per student
    const summary = {};

    attendances.forEach(att => {
        att.records.forEach(record => {
            const studentId = record.studentId._id.toString();
            if (!summary[studentId]) {
                summary[studentId] = {
                    studentId,
                    studentName: record.studentId.profile?.fullName,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0
                };
            }
            summary[studentId][record.status]++;
            summary[studentId].total++;
        });
    });

    const reportData = Object.values(summary).map(s => ({
        ...s,
        attendanceRate: s.total > 0 ? ((s.present + s.late) / s.total * 100).toFixed(2) : 0
    }));

    return {
        classId,
        startDate,
        endDate,
        totalSessions: attendances.length,
        students: reportData
    };
}

module.exports = {
    getAttendanceByClass,
    getAttendanceById,
    getStudentAttendance,
    markAttendance,
    overrideAttendance,
    getAttendanceReport
};
