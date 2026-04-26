import { TEACHER } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as teacherRepository from "./teacher.repository.js";
import * as userRepository from "../user/user.repository.js";

const assertTeacherUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== TEACHER) {
    throw new AppError("User role must be teacher", 400);
  }

  return user;
};

export const createTeacher = async (payload) => {
  await assertTeacherUser(payload.user_id);

  const existingProfile = await teacherRepository.findByUserId(payload.user_id);

  if (existingProfile) {
    throw new AppError("User already has a teacher profile", 409);
  }

  return teacherRepository.create(payload);
};

export const getTeachers = async () => {
  return teacherRepository.findAll();
};

export const getTeacherById = async (id) => {
  const teacher = await teacherRepository.findById(id);

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacher;
};

export const getTeacherByUserId = async (userId) => {
  const teacher = await teacherRepository.findByUserId(userId);

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  return teacher;
};

export const getTeacherOfferings = async (id) => {
  const teacher = await teacherRepository.findById(id);

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  return teacherRepository.getOfferings(id);
};

export const getTeacherOfferingsByUserId = async (userId) => {
  const teacher = await teacherRepository.findByUserId(userId);

  if (!teacher) {
    throw new AppError("Teacher profile not found", 404);
  }

  return teacherRepository.getOfferings(teacher.id);
};

export const updateTeacher = async (id, payload) => {
  const existingTeacher = await teacherRepository.findById(id);

  if (!existingTeacher) {
    throw new AppError("Teacher not found", 404);
  }

  if (payload.user_id) {
    await assertTeacherUser(payload.user_id);
  }

  const data = omitUndefined(payload);
  return teacherRepository.update(id, data);
};
