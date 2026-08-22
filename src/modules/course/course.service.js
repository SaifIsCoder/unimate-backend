import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as courseRepository from "./course.repository.js";
import { getPagination } from "../../utils/pagination.js";

const assertUniqueCode = async (code, currentCourseId = null) => {
  if (!code) {
    return;
  }

  const course = await courseRepository.findByCode(code);

  if (course && course.id !== currentCourseId) {
    throw new AppError("Course code is already in use", 409);
  }
};

export const createCourse = async (payload) => {
  await assertUniqueCode(payload.code);

  return courseRepository.create(payload);
};

export const getCourses = async (query = {}) => {
  const { page, limit, offset } = getPagination(query);
  return courseRepository.findAll(limit, offset);
};

export const getCourseById = async (id) => {
  const course = await courseRepository.findById(id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

export const updateCourse = async (id, payload) => {
  const course = await courseRepository.findById(id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  await assertUniqueCode(payload.code, id);

  const data = omitUndefined(payload);
  return courseRepository.update(id, data);
};

export const deleteCourse = async (id) => {
  const course = await courseRepository.remove(id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};
