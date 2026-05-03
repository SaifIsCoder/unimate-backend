import * as gradesService from "./grades.service.js";
import { sendSuccess } from "../../utils/response.js";

export const submitGrade = async (req, res) => {
  const grade = await gradesService.submitGrade(req.body);
  return sendSuccess(res, grade, 201);
};

export const getGradesByOffering = async (req, res) => {
  const grades = await gradesService.getGradesByOffering(req.params.offeringId);
  return sendSuccess(res, grades);
};

export const calculateCourseGrade = async (req, res) => {
  const { studentId, offeringId } = req.params;
  const gradeCalc = await gradesService.calculateCourseGrade(studentId, offeringId);
  return sendSuccess(res, gradeCalc);
};

export const getStudentTranscript = async (req, res) => {
  const transcript = await gradesService.getStudentTranscript(req.params.studentId);
  return sendSuccess(res, transcript);
};
