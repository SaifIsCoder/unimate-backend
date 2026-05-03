import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as gradesRepository from "./grades.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
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

const GP_MAP = {
  100: 4.0,
  99: 4.0,
  98: 4.0,
  97: 4.0,
  96: 4.0,
  95: 4.0,
  94: 4.0,
  93: 4.0,
  92: 4.0,
  91: 4.0,
  90: 4.0,
  89: 4.0,
  88: 4.0,
  87: 4.0,
  86: 4.0,
  85: 4.0,
  84: 4.0,
  83: 4.0,
  82: 4.0,
  81: 4.0,
  80: 4.0,
  79: 3.94,
  78: 3.87,
  77: 3.8,
  76: 3.74,
  75: 3.67,
  74: 3.6,
  73: 3.54,
  72: 3.47,
  71: 3.4,
  70: 3.34,
  69: 3.27,
  68: 3.2,
  67: 3.14,
  66: 3.07,
  65: 3.0,
  64: 2.92,
  63: 2.85,
  62: 2.78,
  61: 2.7,
  60: 2.64,
  59: 2.57,
  58: 2.5,
  57: 2.43,
  56: 2.36,
  55: 2.3,
  54: 2.24,
  53: 2.18,
  52: 2.12,
  51: 2.06,
  50: 2.0,
  49: 1.9,
  48: 1.8,
  47: 1.7,
  46: 1.6,
  45: 1.5,
  44: 1.4,
  43: 1.3,
  42: 1.2,
  41: 1.1,
  40: 1.0,
};

const getGradePoint = (marks) => {
  if (marks >= 80) return 4.0;
  if (marks < 40) return 0.0;
  return GP_MAP[Math.floor(marks)] || 0.0;
};

export const submitGrade = async (payload, user) => {
  return withTransaction(async (client) => {
    const offering = await offeringRepository.findPlainById(payload.offering_id, client);
    if (!offering) throw new AppError("Offering not found", 404);

    if (user) {
      await assertTeacherOwnership(user, offering);
    }

    const enrollment = await enrollmentRepository.findByStudentAndOffering(
      payload.student_id,
      payload.offering_id,
      client,
    );
    
    if (!enrollment || enrollment.status !== 'enrolled') {
      throw new AppError("Student is not actively enrolled in this offering", 400);
    }

    if (payload.score > payload.max_score) {
      throw new AppError("Score cannot exceed max score", 400);
    }

    const gradeData = {
      ...payload,
      enrollment_id: enrollment.id,
    };

    return gradesRepository.upsertGrade(gradeData, client);
  });
};

export const getGradesByOffering = async (offeringId) => {
  return gradesRepository.findGradesByOffering(offeringId);
};

export const calculateCourseGrade = async (studentId, offeringId) => {
  return withTransaction(async (client) => {
    // Need course info for 'has_practical'
    const query = `
      SELECT c.has_practical 
      FROM course_offerings co 
      JOIN courses c ON c.id = co.course_id 
      WHERE co.id = $1
    `;
    const courseRes = await client.query(query, [offeringId]);
    if (courseRes.rowCount === 0) throw new AppError("Offering not found", 404);

    const hasPractical = courseRes.rows[0].has_practical;
    const grades = await gradesRepository.findGradesByStudentAndOffering(
      studentId,
      offeringId,
      client,
    );

    let midScore = 0;
    let sessionalScore = 0; // Accumulated from assignments and direct sessional entries
    let sessionalMax = 0;
    let finalScore = 0;
    let practicalScore = 0;

    grades.forEach((g) => {
      const percentage = (Number(g.score) / Number(g.max_score)) * 100; // normalized to 100

      if (g.assessment_type === "midterm") midScore = percentage;
      else if (g.assessment_type === "final") finalScore = percentage;
      else if (g.assessment_type === "practical") practicalScore = percentage;
      else if (g.assessment_type === "sessional") {
        sessionalScore += Number(g.score);
        sessionalMax += Number(g.max_score);
      } else if (g.assessment_type === "assignment") {
        sessionalScore += Number(g.score);
        sessionalMax += Number(g.max_score);
      }
    });

    let sessionalPercentage = 0;
    if (sessionalMax > 0) {
      sessionalPercentage = (sessionalScore / sessionalMax) * 100;
    }

    let rawMarks = 0;
    if (hasPractical) {
      rawMarks =
        midScore * 0.15 +
        sessionalPercentage * 0.15 +
        finalScore * 0.45 +
        practicalScore * 0.25;
    } else {
      rawMarks = midScore * 0.3 + sessionalPercentage * 0.2 + finalScore * 0.5;
    }

    const finalMarks = Math.ceil(rawMarks);
    const gradePoint = getGradePoint(finalMarks);

    return {
      raw_marks: rawMarks,
      final_marks: finalMarks,
      grade_point: gradePoint,
      has_practical: hasPractical,
      components: {
        mid_term: midScore,
        sessional: sessionalPercentage,
        final_exam: finalScore,
        practical: practicalScore,
      },
    };
  });
};

export const getStudentTranscript = async (studentId) => {
  const data = await gradesRepository.findTranscriptDataForStudent(studentId);

  // Group grades by offering
  const offeringsMap = {};

  data.forEach((row) => {
    if (!offeringsMap[row.offering_id]) {
      offeringsMap[row.offering_id] = {
        offering_id: row.offering_id,
        semester: row.semester,
        course_code: row.course_code,
        course_title: row.course_title,
        credit_hours: row.credit_hours,
        has_practical: row.has_practical,
        grades: [],
      };
    }
    if (row.id) {
      // If there is a grade record
      offeringsMap[row.offering_id].grades.push(row);
    }
  });

  let totalCreditHours = 0;
  let totalQualityPoints = 0;

  const coursesResult = Object.values(offeringsMap).map((offering) => {
    let midScore = 0;
    let sessionalScore = 0;
    let sessionalMax = 0;
    let finalScore = 0;
    let practicalScore = 0;

    offering.grades.forEach((g) => {
      const percentage = (Number(g.score) / Number(g.max_score)) * 100;
      if (g.assessment_type === "midterm") midScore = percentage;
      else if (g.assessment_type === "final") finalScore = percentage;
      else if (g.assessment_type === "practical") practicalScore = percentage;
      else if (
        g.assessment_type === "sessional" ||
        g.assessment_type === "assignment"
      ) {
        sessionalScore += Number(g.score);
        sessionalMax += Number(g.max_score);
      }
    });

    let sessionalPercentage = 0;
    if (sessionalMax > 0)
      sessionalPercentage = (sessionalScore / sessionalMax) * 100;

    let rawMarks = 0;
    if (offering.has_practical) {
      rawMarks =
        midScore * 0.15 +
        sessionalPercentage * 0.15 +
        finalScore * 0.45 +
        practicalScore * 0.25;
    } else {
      rawMarks = midScore * 0.3 + sessionalPercentage * 0.2 + finalScore * 0.5;
    }

    const finalMarks = Math.ceil(rawMarks);
    const gradePoint = getGradePoint(finalMarks);
    const qualityPoints = gradePoint * offering.credit_hours;

    totalCreditHours += offering.credit_hours;
    totalQualityPoints += qualityPoints;

    return {
      offering_id: offering.offering_id,
      semester: offering.semester,
      course: offering.course_title,
      credit_hours: offering.credit_hours,
      final_marks: finalMarks,
      grade_point: gradePoint,
      quality_points: Number(qualityPoints.toFixed(2)),
    };
  });

  const cgpa = totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;

  return {
    cgpa: Number(cgpa.toFixed(2)),
    total_credit_hours: totalCreditHours,
    courses: coursesResult,
  };
};
