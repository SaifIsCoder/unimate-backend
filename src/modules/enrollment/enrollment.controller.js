import * as enrollmentService from "./enrollment.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.createEnrollment(req.body);
  return sendSuccess(res, enrollment, 201);
};

export const getEnrollments = async (req, res) => {
  const enrollments = await enrollmentService.getEnrollments();
  return sendSuccess(res, enrollments);
};

export const getEnrollmentById = async (req, res) => {
  const enrollment = await enrollmentService.getEnrollmentById(req.params.id);
  return sendSuccess(res, enrollment);
};

export const getEnrollmentsByStudent = async (req, res) => {
  const enrollments = await enrollmentService.getEnrollmentsByStudent(req.params.id);
  return sendSuccess(res, enrollments);
};

export const getEnrollmentsByOffering = async (req, res) => {
  const enrollments = await enrollmentService.getEnrollmentsByOffering(req.params.id);
  return sendSuccess(res, enrollments);
};

export const updateEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.updateEnrollment(req.params.id, req.body);
  return sendSuccess(res, enrollment);
};

export const deleteEnrollment = async (req, res) => {
  const enrollment = await enrollmentService.deleteEnrollment(req.params.id);
  return sendSuccess(res, enrollment);
};
