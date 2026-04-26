import * as courseService from "./course.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createCourse = async (req, res) => {
  const course = await courseService.createCourse(req.body);
  return sendSuccess(res, course, 201);
};

export const getCourses = async (req, res) => {
  const courses = await courseService.getCourses();
  return sendSuccess(res, courses);
};

export const getCourseById = async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  return sendSuccess(res, course);
};

export const updateCourse = async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body);
  return sendSuccess(res, course);
};

export const deleteCourse = async (req, res) => {
  const course = await courseService.deleteCourse(req.params.id);
  return sendSuccess(res, course);
};
