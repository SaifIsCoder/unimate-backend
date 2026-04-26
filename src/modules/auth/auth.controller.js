import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

export const loginAdmin = async (req, res) => {
  const data = await authService.loginAdmin(req.body);
  return sendSuccess(res, data);
};

export const loginStudent = async (req, res) => {
  const data = await authService.loginStudent(req.body);
  return sendSuccess(res, data);
};

export const loginTeacher = async (req, res) => {
  const data = await authService.loginTeacher(req.body);
  return sendSuccess(res, data);
};

export const resetPassword = async (req, res) => {
  await authService.resetPassword(req.user.id, req.user.role, req.body.password);
  return sendSuccess(res, { message: "Password updated successfully" });
};
