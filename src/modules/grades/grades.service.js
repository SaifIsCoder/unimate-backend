import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as gradesRepository from "./grades.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as assignmentRepository from "../assignment/assignment.repository.js";
import * as academicRules from "../../utils/academic-rules.js";
import * as authHelpers from "../../utils/auth.helpers.js";
import { logAudit } from "../../utils/audit.js";

// Authorization helpers moved to src/utils/auth.helpers.js

// Academic rule constants moved to src/utils/academic-rules.js

export const submitGrade = async (payload, user) => {
  return withTransaction(async (client) => {
    const offering = await offeringRepository.findPlainById(
      payload.offering_id,
      client,
    );
    if (!offering) throw new AppError("Offering not found", 404);

    if (user) {
      await authHelpers.assertAccessToOffering(user, offering);
    }

    const enrollment = await enrollmentRepository.findByStudentAndOffering(
      payload.student_id,
      payload.offering_id,
      client,
    );

    if (!enrollment || enrollment.status !== "enrolled") {
      throw new AppError(
        "Student is not actively enrolled in this offering",
        400,
      );
    }

    const ASSESSMENT_WITH_REF = [
      "assignment",
      "quiz",
      "presentation",
      "project",
    ];
    if (ASSESSMENT_WITH_REF.includes(payload.assessment_type)) {
      if (!payload.reference_id) {
        throw new AppError(
          `Reference ID is required for ${payload.assessment_type} grades`,
          400,
        );
      }
      const assignment = await assignmentRepository.findAssignmentById(
        payload.reference_id,
        client,
      );
      if (!assignment) {
        throw new AppError("Referenced assessment not found", 404);
      }
      if (assignment.offering_id !== payload.offering_id) {
        throw new AppError(
          "Referenced assessment does not belong to this offering",
          400,
        );
      }
      // Overwrite payload fields to ensure consistency
      payload.max_score = Number(assignment.total_points);
      payload.title = assignment.title;
    }

    if (payload.score > payload.max_score) {
      throw new AppError("Score cannot exceed max score", 400);
    }

    const gradeData = {
      ...payload,
      enrollment_id: enrollment.id,
    };

    const result = await gradesRepository.upsertGrade(gradeData, client);

    logAudit(
      {
        action: "GRADE_SUBMITTED",
        actorId: user?.id,
        targetId: payload.student_id,
        metadata: {
          offeringId: payload.offering_id,
          assessmentType: payload.assessment_type,
          score: payload.score,
          maxScore: payload.max_score,
        },
      },
      `Grade submitted for student ${payload.student_id} in offering ${payload.offering_id}`,
    );

    return result;
  });
};

export const getGradesByOffering = async (offeringId, user, options) => {
  const offering = await offeringRepository.findPlainById(offeringId);
  if (!offering) throw new AppError("Offering not found", 404);
  await authHelpers.assertAccessToOffering(user, offering);

  return gradesRepository.findGradesByOffering(offeringId, options);
};

export const calculateCourseGrade = async (studentId, offeringId, user) => {
  const offering =
    await offeringRepository.findByIdWithCourseDetails(offeringId);
  if (!offering) throw new AppError("Offering not found", 404);

  const hasPractical = offering.has_practical;

  // Authorization check
  await authHelpers.assertAccessToOffering(user, offering);

  if (user.role === "student") {
    const student = await studentRepository.findByUserId(user.id);
    if (!student || String(student.id) !== String(studentId)) {
      throw new AppError("Forbidden: You can only view your own grades", 403);
    }
  }

  return withTransaction(async (client) => {
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
      else if (
        g.assessment_type === "sessional" ||
        g.assessment_type === "assignment" ||
        g.assessment_type === "quiz" ||
        g.assessment_type === "presentation" ||
        g.assessment_type === "project"
      ) {
        sessionalScore += Number(g.score);
        sessionalMax += Number(g.max_score);
      }
    });

    let sessionalPercentage = 0;
    if (sessionalMax > 0) {
      sessionalPercentage = (sessionalScore / sessionalMax) * 100;
    }

    const rawMarks = academicRules.calculateRawMarks(
      {
        midTerm: midScore,
        sessional: sessionalPercentage,
        finalExam: finalScore,
        practical: practicalScore,
      },
      offering
    );

    const finalMarks = Math.ceil(rawMarks);
    const { grade, gp } = academicRules.getGradePointDetails(finalMarks);

    return {
      raw_marks: rawMarks,
      final_marks: finalMarks,
      letter_grade: grade,
      grade_point: gp,
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

export const getStudentTranscript = async (studentId, user) => {
  if (user.role === "student") {
    const student = await studentRepository.findByUserId(user.id);
    if (!student || String(student.id) !== String(studentId)) {
      throw new AppError(
        "Forbidden: You can only view your own transcript",
        403,
      );
    }
  } else if (user.role !== "admin") {
    // Teachers shouldn't see full transcripts of students unless they are admins
    throw new AppError(
      "Forbidden: You are not authorized to view student transcripts",
      403,
    );
  }

  const data = await gradesRepository.findTranscriptDataForStudent(studentId);
  return academicRules.transformTranscriptData(data);
};
