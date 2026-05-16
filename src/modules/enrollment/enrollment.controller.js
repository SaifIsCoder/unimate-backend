import * as enrollmentService from "./enrollment.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.createEnrollment(req.body, req.user);
  return sendSuccess(res, enrollment, 201);
};

export const getEnrollments = async (req, res) => {
  const { page, limit } = req.query;
  const enrollments = await enrollmentService.getEnrollments({ page, limit });
  return sendSuccess(res, enrollments);
};

export const getEnrollmentById = async (req, res) => {
  const enrollment = await enrollmentService.getEnrollmentById(req.params.id);
  return sendSuccess(res, enrollment);
};

export const getEnrollmentsByStudent = async (req, res) => {
  const { page, limit } = req.query;
  const result = await enrollmentService.getEnrollmentsByStudent(req.params.studentId, { page, limit });
  return sendSuccess(res, result);
};

export const getEnrollmentsByOffering = async (req, res) => {
  const { page, limit } = req.query;
  const result = await enrollmentService.getEnrollmentsByOffering(req.params.offeringId, { page, limit });
  return sendSuccess(res, result);
};

export const updateEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.updateEnrollment(req.params.id, req.body, req.user);
  return sendSuccess(res, enrollment);
};

export const deleteEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.deleteEnrollment(req.params.id, req.user);
  return sendSuccess(res, enrollment);
};
