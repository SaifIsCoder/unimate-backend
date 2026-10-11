import * as teacherService from "./teacher.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createTeacher = async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);
  return sendSuccess(res, teacher, 201);
};

export const getTeachers = async (req, res) => {
  const query = { ...req.query };
  if (req.user?.role === "admin" && req.user?.department_id) {
    query.department_id = req.user.department_id;
  }
  const teachers = await teacherService.getTeachers(query);
  return sendSuccess(res, teachers);
};

export const getMe = async (req, res) => {
  const teacher = await teacherService.getTeacherByUserId(req.user.id);
  return sendSuccess(res, teacher);
};

export const getTeacherById = async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id);
  return sendSuccess(res, teacher);
};

export const getTeacherOfferings = async (req, res) => {
  const offerings = await teacherService.getTeacherOfferings(req.params.id);
  return sendSuccess(res, offerings);
};

export const getMyOfferings = async (req, res) => {
  const offerings = await teacherService.getTeacherOfferingsByUserId(req.user.id);
  return sendSuccess(res, offerings);
};

export const getMyAnalytics = async (req, res) => {
  const analytics = await teacherService.getMyAnalytics(req.user.id);
  return sendSuccess(res, analytics);
};

export const updateTeacher = async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);
  return sendSuccess(res, teacher);
};
export const deleteTeacher = async (req, res) => {
  await teacherService.deleteTeacher(req.params.id);
  return sendSuccess(res, { message: "Teacher profile deleted successfully" });
};
