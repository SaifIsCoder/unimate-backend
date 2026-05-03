import * as assignmentService from "./assignment.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createAssignment = async (req, res) => {
  const assignment = await assignmentService.createAssignment(req.body, req.user);
  return sendSuccess(res, assignment, 201);
};

export const getAssignmentsByOffering = async (req, res) => {
  const assignments = await assignmentService.getAssignmentsByOffering(req.params.offeringId);
  return sendSuccess(res, assignments);
};

export const deleteAssignment = async (req, res) => {
  const assignment = await assignmentService.deleteAssignment(req.params.id, req.user);
  return sendSuccess(res, assignment);
};

export const updateAssignment = async (req, res) => {
  const assignment = await assignmentService.updateAssignment(
    req.params.id,
    req.body,
    req.user
  );
  return sendSuccess(res, assignment);
};

export const markAsDone = async (req, res) => {
  const assignment = await assignmentService.markAsDone(req.params.id, req.user);
  return sendSuccess(res, assignment);
};
