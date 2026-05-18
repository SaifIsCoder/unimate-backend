import * as authService from "./auth.service.js";
import * as userService from "../user/user.service.js";
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

// ── Unified auth flow controllers for Mobile ──────────────────────────────────────

export const loginUnified = async (req, res) => {
  const data = await authService.loginUnified(req.body);
  return sendSuccess(res, data);
};

export const refreshUnified = async (req, res) => {
  const { refreshToken } = req.body;
  const data = await authService.refreshUnified(refreshToken);
  return sendSuccess(res, data);
};

export const logoutUnified = async (req, res) => {
  return sendSuccess(res, { message: "Logged out successfully" });
};

export const setPassword = async (req, res) => {
  const password = req.body.newPassword || req.body.password;
  await authService.resetPassword(req.user.id, req.user.role, password);
  return sendSuccess(res, { message: "Password updated successfully" });
};

export const getMe = async (req, res) => {
  const user = await userService.getMe(req.user.id);
  return sendSuccess(res, user);
};
