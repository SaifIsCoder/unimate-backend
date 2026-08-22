import * as adminService from "./admin.service.js";
import { sendSuccess } from "../../utils/response.js";

export const getAdmins = async (req, res) => {
  const admins = await adminService.getAdmins(req.query);
  return sendSuccess(res, admins);
};

export const getAdminById = async (req, res) => {
  const admin = await adminService.getAdminById(req.params.id);
  return sendSuccess(res, admin);
};

export const updateAdmin = async (req, res) => {
  const admin = await adminService.updateAdmin(req.params.id, req.body);
  return sendSuccess(res, admin);
};

export const deleteAdmin = async (req, res) => {
  await adminService.deleteAdmin(req.params.id);
  return sendSuccess(res, null);
};

export const getMe = async (req, res) => {
  const admin = await adminService.getAdminByUserId(req.user.id);
  return sendSuccess(res, admin);
};
