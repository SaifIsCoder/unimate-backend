import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as assignmentRepository from "./assignment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";

const assertOfferingExists = async (offeringId, client) => {
  const offering = await offeringRepository.findPlainById(offeringId, client);
  if (!offering) {
    throw new AppError("Offering not found", 404);
  }
  return offering;
};

export const createAssignment = async (payload) => {
  return withTransaction(async (client) => {
    await assertOfferingExists(payload.offering_id, client);

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

export const deleteAssignment = async (id) => {
  const assignment = await assignmentRepository.deleteAssignment(id);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }
  return assignment;
};

export const updateAssignment = async (id, payload) => {
  const assignment = await assignmentRepository.updateAssignment(id, payload);
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }
  return assignment;
};

export const markAsDone = async (id) => {
  const assignment = await assignmentRepository.updateAssignment(id, { is_done: true });
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }
  return assignment;
};
