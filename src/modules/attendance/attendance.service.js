import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as attendanceRepository from "./attendance.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as authHelpers from "../../utils/auth.helpers.js";
import { pool } from "../../config/db.js";
import * as academicRules from "../../utils/academic-rules.js";

// Authorization helpers moved to src/utils/auth.helpers.js

export const recordAttendance = async (payload, user) => {
  return withTransaction(async (client) => {
    const { offering_id, date, records, session_id, schedule_id, exception_id } = payload;
    
    let session;
    let offering;

    if (session_id) {
      session = await attendanceRepository.getSessionById(session_id, client);
      if (!session) throw new AppError("Attendance session not found", 404);
      offering = await authHelpers.assertOfferingExists(session.offering_id, client);
    } else {
      offering = await authHelpers.assertOfferingExists(offering_id, client);
      session = await attendanceRepository.upsertSession(
        offering_id, 
        date, 
        { schedule_id, exception_id }, 
        client
      );
    }

    if (user) {
      await authHelpers.assertAccessToOffering(user, offering);
    }

    const offeringId = offering.id;

    // Get all enrolled students for this offering
    const enrollmentsResult = await enrollmentRepository.findByOffering(offeringId, {}, client);
    const enrollments = enrollmentsResult.data;
    // Filter to only actively enrolled students
    const activeEnrollments = enrollments.filter(e => e.status === 'enrolled');
    const enrolledMap = new Map();
    for (const e of activeEnrollments) {
      enrolledMap.set(String(e.student_id), String(e.id));
    }

    // Prepare default records (all present)
    const finalRecordsMap = new Map();
    for (const [studentId, enrollmentId] of enrolledMap.entries()) {
      finalRecordsMap.set(studentId, { enrollment_id: enrollmentId, status: 'present' });
    }

    // Override with provided records (teacher only sends absent/late/leave)
    if (records && records.length > 0) {
      for (const rec of records) {
        if (!enrolledMap.has(String(rec.student_id))) {
          throw new AppError(`Student ${rec.student_id} is not actively enrolled in this offering`, 400);
        }
        finalRecordsMap.set(String(rec.student_id), {
          enrollment_id: enrolledMap.get(String(rec.student_id)),
          status: rec.status,
        });
      }
    }

    // Bulk upsert records
    const finalRecordsArray = Array.from(finalRecordsMap.values());
    const savedRecords = await attendanceRepository.bulkUpsertRecords(session.id, finalRecordsArray, client);

    return { session, records: savedRecords };
  });
};

export const createSession = async (payload, user) => {
  const { offering_id, date, schedule_id, exception_id } = payload;
  const offering = await authHelpers.assertOfferingExists(offering_id);
  await authHelpers.assertAccessToOffering(user, offering);

  return attendanceRepository.upsertSession(offering_id, date, { schedule_id, exception_id });
};

export const getSessionsByOffering = async (offeringId, user) => {
  const offering = await authHelpers.assertOfferingExists(offeringId);
  await authHelpers.assertAccessToOffering(user, offering);

  return attendanceRepository.getSessionsByOffering(offeringId);
};

export const getSessionRecords = async (sessionId, user) => {
  const session = await attendanceRepository.getSessionById(sessionId);
  if (!session) {
    throw new AppError("Attendance session not found", 404);
  }

  const offering = await authHelpers.assertOfferingExists(session.offering_id);
  await authHelpers.assertAccessToOffering(user, offering);

  return attendanceRepository.getRecordsBySession(sessionId);
};

export const getAttendanceStats = async (offeringId, user, options) => {
  const offering = await authHelpers.assertOfferingExists(offeringId);
  await authHelpers.assertAccessToOffering(user, offering);

  const { totalLectures, studentStats } = await attendanceRepository.getAttendanceStats(offeringId, options);

  const results = studentStats.data.map(stat => {
    const stats = academicRules.calculateAttendanceStats(totalLectures, stat.present_count, stat.leave_count);

    return {
      student_id: stat.student_id,
      roll_number: stat.roll_number,
      total_lectures: totalLectures,
      leaves: stats.leaves,
      adjusted_total: stats.adjustedTotal,
      present: parseInt(stat.present_count, 10),
      absent: parseInt(stat.absent_count, 10),
      late: parseInt(stat.late_count, 10),
      attendance_percentage: stats.attendancePercentage,
      eligible_for_exam: stats.isEligible
    };
  });

  // Security Fix: If student, filter to only their own record
  let finalData = results;
  if (user.role === 'student') {
    const student = await studentRepository.findByUserId(user.id);
    if (!student) throw new AppError("Student profile not found", 403);
    finalData = results.filter(r => String(r.student_id) === String(student.id));
  }

  return {
    data: finalData,
    meta: {
      ...studentStats.meta,
      total: finalData.length // Update total count if filtered
    }
  };
};

// ── Mobile Student Attendance Summary ─────────────────────────────────────────────

export const getMyAttendanceSummary = async (userId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  const query = `
    SELECT 
      e.id AS enrollment_id,
      e.offering_id,
      c.code AS course_code,
      c.title AS course_title,
      COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'absent') AS absent_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'late') AS late_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'leave') AS leave_count,
      (SELECT COUNT(*)::int FROM attendance_sessions WHERE offering_id = e.offering_id) AS total_lectures
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    LEFT JOIN attendance_records ar ON ar.enrollment_id = e.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    GROUP BY e.id, e.offering_id, c.code, c.title
  `;
  const result = await pool.query(query, [student.id]);
  
  let totalLectures = 0;
  let totalPresent = 0;
  let totalLeaves = 0;
  
  const courses = result.rows.map(row => {
    const present = parseInt(row.present_count, 10) || 0;
    const absent = parseInt(row.absent_count, 10) || 0;
    const late = parseInt(row.late_count, 10) || 0;
    const leaves = parseInt(row.leave_count, 10) || 0;
    const lectures = parseInt(row.total_lectures, 10) || 0;
    
    const adjustedTotal = lectures - leaves;
    let percentage = 100.0;
    if (adjustedTotal > 0) {
      percentage = (present / adjustedTotal) * 100;
    }
    
    totalLectures += lectures;
    totalPresent += present;
    totalLeaves += leaves;
    
    return {
      offering_id: row.offering_id,
      course_code: row.course_code,
      course_title: row.course_title,
      total_lectures: lectures,
      present,
      absent,
      late,
      leave: leaves,
      attendance_percentage: Number(percentage.toFixed(2)),
      eligible: percentage >= 75
    };
  });
  
  const overallAdjustedTotal = totalLectures - totalLeaves;
  let overallPercentage = 100.0;
  if (overallAdjustedTotal > 0) {
    overallPercentage = (totalPresent / overallAdjustedTotal) * 100;
  }
  
  return {
    averageAttendance: Number(overallPercentage.toFixed(2)),
    courses
  };
};

export const getMyAttendanceHistory = async (userId, offeringId) => {
  const student = await studentRepository.findByUserId(userId);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }
  return attendanceRepository.findStudentAttendanceHistory(student.id, offeringId);
};
