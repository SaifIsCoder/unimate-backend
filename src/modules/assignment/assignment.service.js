import { AppError } from "../../utils/app-error.js";
import { withTransaction } from "../../utils/transaction.js";
import * as assignmentRepository from "./assignment.repository.js";
import * as offeringRepository from "../offering/offering.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as enrollmentRepository from "../enrollment/enrollment.repository.js";
import * as authHelpers from "../../utils/auth.helpers.js";
import { logAudit } from "../../utils/audit.js";


// Authorization helpers moved to src/utils/auth.helpers.js

export const createAssignment = async (payload, user) => {
  return withTransaction(async (client) => {
    const offering = await authHelpers.assertOfferingExists(payload.offering_id, client);

    if (user) {
      await authHelpers.assertAccessToOffering(user, offering);
    }

    if (new Date(payload.due_date) < new Date()) {
      throw new AppError("Due date cannot be in the past", 400);
    }

    const duplicate = await assignmentRepository.findDuplicateAssignment(
      payload.offering_id,
      payload.title,
      payload.description,
      null,
      client
    );

    if (duplicate) {
      throw new AppError("An assignment with this title and description already exists for this offering", 409);
    }

    const result = await assignmentRepository.createAssignment(payload, client);
    
    logAudit({
      action: "ASSIGNMENT_CREATED",
      actorId: user?.id,
      targetId: result.id,
      metadata: { offeringId: payload.offering_id, title: payload.title }
    }, `Assignment ${payload.title} created for offering ${payload.offering_id}`);

    return result;
  });
};

export const getAssignmentsByOffering = async (offeringId, user) => {
  const offering = await authHelpers.assertOfferingExists(offeringId);
  await authHelpers.assertAccessToOffering(user, offering);
  
  return assignmentRepository.findAssignmentsByOffering(offeringId);
};

export const deleteAssignment = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  const assignment = await assignmentRepository.deleteAssignment(id);

  logAudit({
    action: "ASSIGNMENT_DELETED",
    actorId: user?.id,
    targetId: id,
  }, `Assignment ${id} deleted`);

  return assignment;
};

export const updateAssignment = async (id, payload, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  if (payload.title !== undefined || payload.description !== undefined) {
    const newTitle = payload.title !== undefined ? payload.title : existing.title;
    const newDescription = payload.description !== undefined ? payload.description : existing.description;

    const duplicate = await assignmentRepository.findDuplicateAssignment(
      existing.offering_id,
      newTitle,
      newDescription,
      id
    );

    if (duplicate) {
      throw new AppError("Another assignment with this title and description already exists for this offering", 409);
    }
  }

  const assignment = await assignmentRepository.updateAssignment(id, payload);

  logAudit({
    action: "ASSIGNMENT_UPDATED",
    actorId: user?.id,
    targetId: id,
    metadata: payload
  }, `Assignment ${id} updated`);

  return assignment;
};

export const markAsDone = async (id, user) => {
  const existing = await assignmentRepository.findAssignmentById(id);
  if (!existing) {
    throw new AppError("Assignment not found", 404);
  }

  if (user) {
    const offering = await authHelpers.assertOfferingExists(existing.offering_id);
    await authHelpers.assertAccessToOffering(user, offering);
  }

  const assignment = await assignmentRepository.updateAssignment(id, { is_done: true });

  logAudit({
    action: "ASSIGNMENT_COMPLETED",
    actorId: user?.id,
    targetId: id,
  }, `Assignment ${id} marked as done`);

  return assignment;
};
