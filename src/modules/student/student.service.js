import { STUDENT } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as studentRepository from "./student.repository.js";
import * as userRepository from "../user/user.repository.js";

const assertStudentUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== STUDENT) {
    throw new AppError("User role must be student", 400);
  }

  return user;
};

export const createStudent = async (payload) => {
  await assertStudentUser(payload.user_id);

  const existingProfile = await studentRepository.findByUserId(payload.user_id);

  if (existingProfile) {
    throw new AppError("User already has a student profile", 409);
  }

  return studentRepository.create(payload);
};

export const getStudents = async () => {
  return studentRepository.findAll();
};

export const getStudentById = async (id) => {
  const student = await studentRepository.findById(id);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return student;
};

export const getStudentByUserId = async (userId) => {
  console.log("service",userId);
  const student = await studentRepository.findByUserId(userId);
  console.log("service",student);
  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  return student;
};

export const getStudentEnrollments = async (id) => {
  const student = await studentRepository.findById(id);

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  return studentRepository.getEnrollments(id);
};

export const getStudentEnrollmentsByUserId = async (userId) => {
  const student = await studentRepository.findByUserId(userId);

  if (!student) {
    throw new AppError("Student profile not found", 404);
  }

  return studentRepository.getEnrollments(student.id);
};

export const updateStudent = async (id, payload) => {
  const existingStudent = await studentRepository.findById(id);

  if (!existingStudent) {
    throw new AppError("Student not found", 404);
  }

  if (payload.user_id) {
    await assertStudentUser(payload.user_id);
  }

  const data = omitUndefined(payload);
  return studentRepository.update(id, data);
};
