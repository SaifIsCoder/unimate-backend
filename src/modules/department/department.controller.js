import * as departmentService from "./department.service.js";
import { sendSuccess } from "../../utils/response.js";

export const createDepartment = async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  return sendSuccess(res, department, 201);
};

export const getDepartments = async (req, res) => {
  const query = { ...req.query };
  if (req.user?.role === "admin" && req.user?.department_id) {
    query.department_id = req.user.department_id;
  }
  const departments = await departmentService.getDepartments(query);
  return sendSuccess(res, departments);
};

export const getDepartmentById = async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return sendSuccess(res, department);
};

export const updateDepartment = async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  return sendSuccess(res, department);
};

export const deleteDepartment = async (req, res) => {
  const department = await departmentService.deleteDepartment(req.params.id);
  return sendSuccess(res, department);
};
