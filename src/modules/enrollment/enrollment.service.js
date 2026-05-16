import { ENROLLED } from "../../constants/enrollmentStatus.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import { withTransaction } from "../../utils/transaction.js";
import * as enrollmentRepository from "./enrollment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as studentRepository from "../student/student.repository.js";
import { logAudit } from "../../utils/audit.js";

const ACTIVE_ENROLLMENT_STATUSES = [ENROLLED];

const assertStudentExists = async (studentId) => {
  const student = await studentRepository.findById(studentId);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
};

const assertOfferingExists = async (offeringId, client, options = {}) => {
  const offering = await offeringRepository.findPlainById(offeringId, client, options);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  return offering;
};

export const createEnrollment = async (payload, actor) => {
  return withTransaction(async (client) => {
    await assertStudentExists(payload.student_id);
    const offering = await assertOfferingExists(payload.offering_id, client, { forUpdate: true });

    const duplicateEnrollment = await enrollmentRepository.findByStudentAndOffering(
      payload.student_id,
      payload.offering_id,
      client
    );

    if (duplicateEnrollment) {
      throw new AppError("Student is already enrolled in this offering", 409);
    }

    const activeEnrollmentCount = await enrollmentRepository.countActiveByOffering(payload.offering_id, client);

    if (offering.capacity !== null && activeEnrollmentCount >= offering.capacity) {
      throw new AppError("Offering capacity has been reached", 409);
    }

    const result = await enrollmentRepository.create(
      {
        student_id: payload.student_id,
        offering_id: payload.offering_id,
        status: payload.status ?? ENROLLED,
      },
      client
    );

    logAudit({
      action: "ENROLLMENT_CREATED",
      actorId: actor?.id,
      targetId: result.id,
      metadata: { studentId: payload.student_id, offeringId: payload.offering_id }
    }, `Student ${payload.student_id} enrolled in offering ${payload.offering_id}`);

    return result;
  });
};

export const getEnrollments = async (options = { page: 1, limit: 20 }) => {
  return enrollmentRepository.findAll(options);
};

export const getEnrollmentById = async (id) => {
  const enrollment = await enrollmentRepository.findById(id);

  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }

  return enrollment;
};

export const getEnrollmentsByStudent = async (studentId, options) => {
  await assertStudentExists(studentId);

  return enrollmentRepository.findByStudent(studentId, options);
};

export const getEnrollmentsByOffering = async (offeringId, options) => {
  await assertOfferingExists(offeringId);

  return enrollmentRepository.findByOffering(offeringId, options);
};

export const updateEnrollment = async (id, payload, actor) => {
  return withTransaction(async (client) => {
    const enrollment = await enrollmentRepository.findPlainById(id, client);

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    const targetStudentId = payload.student_id ?? enrollment.student_id;
    const targetOfferingId = payload.offering_id ?? enrollment.offering_id;
    const targetStatus = payload.status ?? enrollment.status;

    if (payload.student_id) {
      await assertStudentExists(payload.student_id);
    }

    const offering = await assertOfferingExists(targetOfferingId, client, { forUpdate: true });
    const duplicateEnrollment = await enrollmentRepository.findByStudentAndOffering(
      targetStudentId,
      targetOfferingId,
      client
    );

    if (duplicateEnrollment && String(duplicateEnrollment.id) !== String(id)) {
      throw new AppError("Student is already enrolled in this offering", 409);
    }

    const willConsumeCapacity = ACTIVE_ENROLLMENT_STATUSES.includes(targetStatus);
    const didConsumeCapacity = ACTIVE_ENROLLMENT_STATUSES.includes(enrollment.status);
    const isNewCapacitySlot =
      willConsumeCapacity && (String(targetOfferingId) !== String(enrollment.offering_id) || !didConsumeCapacity);

    if (isNewCapacitySlot) {
      const activeEnrollmentCount = await enrollmentRepository.countActiveByOffering(targetOfferingId, client);

      if (offering.capacity !== null && activeEnrollmentCount >= offering.capacity) {
        throw new AppError("Offering capacity has been reached", 409);
      }
    }

    const data = omitUndefined(payload);
    const result = await enrollmentRepository.update(id, data, client);

    logAudit({
      action: "ENROLLMENT_UPDATED",
      actorId: actor?.id,
      targetId: id,
      metadata: payload
    }, `Enrollment ${id} updated`);

    return result;
  });
};

export const deleteEnrollment = async (id, actor) => {
  const enrollment = await enrollmentRepository.remove(id);

  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }

  logAudit({
    action: "ENROLLMENT_DELETED",
    actorId: actor?.id,
    targetId: id,
  }, `Enrollment ${id} deleted`);

  return enrollment;
};
