import { isAdmin } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import * as adminRepository from "./admin.repository.js";
import * as userRepository from "../user/user.repository.js";
import { getPagination } from "../../utils/pagination.js";

const assertAdminUser = async (userId) => {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!isAdmin(user.role)) {
    throw new AppError("User role must be admin", 400);
  }

  return user;
};

export const createAdmin = async (payload) => {
  await assertAdminUser(payload.user_id);

  const existingProfile = await adminRepository.findByUserId(payload.user_id);

  if (existingProfile) {
    throw new AppError("User already has an admin profile", 409);
  }

  return adminRepository.create(payload);
};

// get a admins
export const getAdmins = async (query = {}) => {
  const { page, limit, offset } = getPagination(query);
  return adminRepository.findAll(limit, offset);
};

export const getAdminById = async (id) => {
  const admin = await adminRepository.findById(id);

  if (!admin) {
    throw new AppError("Admin profile not found", 404);
  }

  return admin;
};

export const getAdminByUserId = async (userId) => {
  const admin = await adminRepository.findByUserId(userId);

  if (!admin) {
    throw new AppError("Admin profile not found", 404);
  }

  return admin;
};

export const updateAdmin = async (id, payload) => {
  const existingAdmin = await adminRepository.findById(id);

  if (!existingAdmin) {
    throw new AppError("Admin profile not found", 404);
  }

  if (payload.user_id) {
    await assertAdminUser(payload.user_id);
  }

  const data = omitUndefined(payload);
  return adminRepository.update(id, data);
};

export const deleteAdmin = async (id) => {
  const admin = await adminRepository.remove(id);

  if (!admin) {
    throw new AppError("Admin profile not found", 404);
  }

  return admin;
};
