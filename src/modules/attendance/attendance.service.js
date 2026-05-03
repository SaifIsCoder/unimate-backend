import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as attendanceRepository from "./attendance.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";

const assertTeacherOwnership = async (user, offering) => {
  if (user.role === "admin") return;
  if (user.role === "teacher") {
    const teacher = await teacherRepository.findByUserId(user.id);
    if (!teacher || String(teacher.id) !== String(offering.teacher_id)) {
      throw new AppError("Forbidden: You do not own this offering", 403);
    }
  }
};

// Validation Helper
const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

export const recordAttendance = async (payload, user) => {
  return withTransaction(async (client) => {
    const { offering_id, date, records } = payload;
    const offering = await assertOfferingExists(offering_id, client);

    if (user) {
      await assertTeacherOwnership(user, offering);
    }

    // Get all enrolled students for this offering
    const enrollments = await enrollmentRepository.findByOffering(offering_id);
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

    // Create or get session
    const session = await attendanceRepository.upsertSession(offering_id, date, client);

    // Bulk upsert records
    const finalRecordsArray = Array.from(finalRecordsMap.values());
    const savedRecords = await attendanceRepository.bulkUpsertRecords(session.id, finalRecordsArray, client);

    return { session, records: savedRecords };
  });
};

export const getSessionRecords = async (sessionId) => {
  const session = await attendanceRepository.getSessionById(sessionId);
  if (!session) {
    throw new AppError("Attendance session not found", 404);
  }
  return attendanceRepository.getRecordsBySession(sessionId);
};

export const getAttendanceStats = async (offeringId) => {
  await assertOfferingExists(offeringId);
  const data = await attendanceRepository.getAttendanceStats(offeringId);

  const { totalLectures, studentStats } = data;

  const results = studentStats.map(stat => {
    const leaves = parseInt(stat.leave_count, 10);
    const present = parseInt(stat.present_count, 10);
    
    // Adjusted Total = Total Lectures - Leaves
    const adjustedTotal = totalLectures - leaves;
    
    // If Adjusted Total = 0 -> Attendance % = 100
    let attendancePercentage = 100;
    if (adjustedTotal > 0) {
      attendancePercentage = (present / adjustedTotal) * 100;
    }

    // If Attendance % >= 75 -> Eligible
    const isEligible = attendancePercentage >= 75;

    return {
      student_id: stat.student_id,
      roll_number: stat.roll_number,
      total_lectures: totalLectures,
      leaves: leaves,
      adjusted_total: adjustedTotal,
      present: present,
      absent: parseInt(stat.absent_count, 10),
      late: parseInt(stat.late_count, 10),
      attendance_percentage: Number(attendancePercentage.toFixed(2)),
      eligible_for_exam: isEligible
    };
  });

  return results;
};
