import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as attendanceRepository from "./attendance.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";

// Validation Helper
const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

export const recordAttendance = async (payload) => {
  return withTransaction(async (client) => {
    const { offering_id, date, records } = payload;
    await assertOfferingExists(offering_id, client);

    // Get all enrolled students for this offering
    const enrollments = await enrollmentRepository.findByOffering(offering_id);
    const enrolledStudentIds = enrollments.map(e => String(e.student_id));

    // Prepare default records (all present)
    const finalRecordsMap = new Map();
    for (const studentId of enrolledStudentIds) {
      finalRecordsMap.set(studentId, { student_id: studentId, status: 'present' });
    }

    // Override with provided records (teacher only sends absent/late/leave)
    if (records && records.length > 0) {
      for (const rec of records) {
        if (!enrolledStudentIds.includes(String(rec.student_id))) {
          throw new AppError(`Student ${rec.student_id} is not enrolled in this offering`, 400);
        }
        finalRecordsMap.set(String(rec.student_id), rec);
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
