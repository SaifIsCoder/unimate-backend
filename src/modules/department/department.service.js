import { AppError } from "../../utils/app-error.js";
import * as departmentRepository from "./department.repository.js";
import { omitUndefined } from "../../utils/sql.helpers.js";

export const createDepartment = async (payload) => {
  return departmentRepository.create(payload);
};

export const getDepartments = async () => {
  return departmentRepository.findAll();
};

export const getDepartmentById = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw new AppError("Department not found", 404);
  }
  return department;
};

export const updateDepartment = async (id, payload) => {
  const data = omitUndefined(payload);
  const department = await departmentRepository.update(id, data);
  if (!department) {
    throw new AppError("Department not found", 404);
  }
  return department;
};

export const deleteDepartment = async (id) => {
  const department = await departmentRepository.remove(id);
  if (!department) {
    throw new AppError("Department not found", 404);
  }
  return department;
};
