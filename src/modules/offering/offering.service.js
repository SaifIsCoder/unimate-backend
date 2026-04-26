import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as courseRepository from "../course/course.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as offeringRepository from "./offering.repository.js";

const assertCourseExists = async (courseId) => {
  const course = await courseRepository.findById(courseId);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  return course;
};

const assertTeacherExists = async (teacherId) => {
  if (teacherId === undefined || teacherId === null) {
    return null;
  }

  const teacher = await teacherRepository.findById(teacherId);

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
};

export const createOffering = async (payload) => {
  await assertCourseExists(payload.course_id);
  await assertTeacherExists(payload.teacher_id);

  return offeringRepository.create(payload);
};

export const getOfferings = async (filters = {}) => {
  return offeringRepository.findAll(filters);
};

export const getOfferingById = async (id) => {
  const offering = await offeringRepository.findById(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  return offering;
};

export const updateOffering = async (id, payload) => {
  const offering = await offeringRepository.findById(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  if (payload.course_id) {
    await assertCourseExists(payload.course_id);
  }

  await assertTeacherExists(payload.teacher_id);

  const data = omitUndefined(payload);
  return offeringRepository.update(id, data);
};

export const deleteOffering = async (id) => {
  const offering = await offeringRepository.remove(id);

  if (!offering) {
    throw new AppError("Offering not found", 404);
  }

  return offering;
};
