import * as studentService from "./student.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createStudent = async (req, res) => {
  const student = await studentService.createStudent(req.body);
  return sendSuccess(res, student, 201);
};

export const getStudents = async (req, res) => {
  const students = await studentService.getStudents();
  return sendSuccess(res, students);
};

export const getMe = async (req, res) => {
  console.log(req.user);
  console.log("controller",req.user.id);
  const student = await studentService.getStudentByUserId(req.user.id);
  return sendSuccess(res, student);
};

export const getStudentById = async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  return sendSuccess(res, student);
};

export const getStudentEnrollments = async (req, res) => {
  const enrollments = await studentService.getStudentEnrollments(req.params.id);
  return sendSuccess(res, enrollments);
};

export const getMyEnrollments = async (req, res) => {
  const enrollments = await studentService.getStudentEnrollmentsByUserId(req.user.id);
  return sendSuccess(res, enrollments);
};

export const updateStudent = async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  return sendSuccess(res, student);
};
