import * as gradesService from "./grades.service.js";
import { sendSuccess } from "../../utils/response.js";

export const submitGrade = async (req, res) => {
  const grade = await gradesService.submitGrade(req.body, req.user);
  return sendSuccess(res, grade, 201);
};

export const getGradesByOffering = async (req, res) => {
  const { page, limit } = req.query;
  const result = await gradesService.getGradesByOffering(req.params.offeringId, req.user, { page, limit });
  return sendSuccess(res, result);
};

export const calculateCourseGrade = async (req, res) => {
  const { studentId, offeringId } = req.params;
  const gradeCalc = await gradesService.calculateCourseGrade(studentId, offeringId, req.user);
  return sendSuccess(res, gradeCalc);
};

export const getStudentTranscript = async (req, res) => {
  const transcript = await gradesService.getStudentTranscript(req.params.studentId, req.user);
  return sendSuccess(res, transcript);
};
