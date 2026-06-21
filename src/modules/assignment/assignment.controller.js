import * as assignmentService from "./assignment.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createAssignment = async (req, res) => {
  const assignment = await assignmentService.createAssignment(req.body, req.user);
  return sendSuccess(res, assignment, 201);
};

export const getAssignmentsByOffering = async (req, res) => {
  const assignments = await assignmentService.getAssignmentsByOffering(
    req.params.offeringId,
    req.user
  );
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

// ── Mobile Student Assignment Controllers ────────────────────────────────────────

export const getMyAssignments = async (req, res) => {
  const data = await assignmentService.getMyAssignments(req.user.id, req.query.status);
  return sendSuccess(res, data);
};

export const updateMyAssignmentProgress = async (req, res) => {
  const progress = Number(req.body.progress);
  const status = req.body.status;
  const result = await assignmentService.updateMyAssignmentProgress(req.user.id, req.params.id, progress, status);
  return sendSuccess(res, result);
};

// export const submitMyAssignment = async (req, res) => {
//   const { fileUrl, textContent } = req.body;
//   const result = await assignmentService.submitMyAssignment(req.user.id, req.params.id, fileUrl, textContent);
//   return sendSuccess(res, result);
// };

export const getAssignmentDetails = async (req, res) => {
  const details = await assignmentService.getAssignmentDetails(req.params.id, req.user);
  return sendSuccess(res, details);
};

// export const deleteMyAssignmentSubmission = async (req, res) => {
//   const result = await assignmentService.deleteMyAssignmentSubmission(req.user.id, req.params.id);
//   return sendSuccess(res, result);
// };
