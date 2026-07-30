import { AppError } from "./app-error.js";
import { STUDENT, TEACHER, isAdmin } from "../constants/roles.js";
import * as offeringRepository from "../modules/offering/offering.repository.js";
import * as teacherRepository from "../modules/teacher/teacher.repository.js";
import * as studentRepository from "../modules/student/student.repository.js";
import * as enrollmentRepository from "../modules/enrollment/enrollment.repository.js";

/**
 * Ensures a user has access to a specific course offering
 */
export const assertAccessToOffering = async (user, offering) => {
  if (isAdmin(user.role)) return;

  if (user.role === TEACHER) {
    const teacher = await teacherRepository.findByUserId(user.id);
    if (!teacher || String(teacher.id) !== String(offering.teacher_id)) {
      throw new AppError("Forbidden: You do not own this offering", 403);
    }
  }

  if (user.role === STUDENT) {
    const student = await studentRepository.findByUserId(user.id);
    if (!student) throw new AppError("Student profile not found", 403);

    const enrollment = await enrollmentRepository.findByStudentAndOffering(
      student.id,
      offering.id,
    );
    if (!enrollment || enrollment.status !== "enrolled") {
      throw new AppError(
        "Forbidden: You are not enrolled in this offering",
        403,
      );
    }
  }
};

/**
 * Ensures an offering exists and returns it
 */
export const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};
