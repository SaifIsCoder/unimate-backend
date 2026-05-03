import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as assignmentRepository from "./assignment.repository.js";
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

const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

export const createAssignment = async (payload, user) => {
  return withTransaction(async (client) => {
    const offering = await assertOfferingExists(payload.offering_id, client);

    if (user) {
      await assertTeacherOwnership(user, offering);
    }

    if (new Date(payload.due_date) < new Date()) {
      throw new AppError("Due date cannot be in the past", 400);
    }

    return assignmentRepository.createAssignment(payload, client);
  });
};

export const getAssignmentsByOffering = async (offeringId) => {
  await assertOfferingExists(offeringId);
  return assignmentRepository.findAssignmentsByOffering(offeringId);
};

export const deleteAssignment = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await assertOfferingExists(existing.offering_id);
    await assertTeacherOwnership(user, offering);
  }

  const assignment = await assignmentRepository.deleteAssignment(id);
  return assignment;
};

export const updateAssignment = async (id, payload, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await assertOfferingExists(existing.offering_id);
    await assertTeacherOwnership(user, offering);
  }

  const assignment = await assignmentRepository.updateAssignment(id, payload);
  return assignment;
};

export const markAsDone = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await assertOfferingExists(existing.offering_id);
    await assertTeacherOwnership(user, offering);
  }

  const assignment = await assignmentRepository.updateAssignment(id, { is_done: true });
  return assignment;
};
