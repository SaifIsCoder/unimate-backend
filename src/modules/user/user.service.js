import bcrypt from "bcryptjs";
import { SUPER_ADMIN, STUDENT, TEACHER, ADMIN } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import { withTransaction } from "../../utils/transaction.js";
import * as userRepository from "./user.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as adminRepository from "../admins/admin.repository.js";

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const createUser = async (payload, requester) => {
  // Permission Check: Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN
  if (
    [ADMIN, SUPER_ADMIN].includes(payload.role) &&
    requester.role !== SUPER_ADMIN
  ) {
    throw new AppError("Only super admins can create admin accounts", 403);
  }

  return withTransaction(async (client) => {
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("Email is already in use", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await userRepository.createWithClient(client, {
      email: payload.email,
      role: payload.role,
      password_hash: passwordHash,
      is_active: payload.is_active ?? true,
    });

    if (payload.role === STUDENT) {
      await studentRepository.createWithClient(client, omitUndefined({
        user_id: user.id,
        roll_number: payload.roll_number,
        batch: payload.batch,
        department_id: payload.department_id,
      }));
    } else if (payload.role === TEACHER) {
      await teacherRepository.createWithClient(client, omitUndefined({
        user_id: user.id,
        employee_id: payload.employee_id,
        department_id: payload.department_id,
      }));
    } else if (payload.role === ADMIN || payload.role === SUPER_ADMIN) {
      await adminRepository.createWithClient(client, omitUndefined({
        user_id: user.id,
        admin_id: payload.admin_id,
        department_id: payload.department_id,
      }));
    }

    return sanitizeUser(user);
  });
};

export const getUsers = async () => {
  return userRepository.findAll();
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUser = async (id, payload) => {
  const existingUser = await userRepository.findById(id);

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  if (payload.email) {
    const emailOwner = await userRepository.findByEmail(payload.email);

    if (emailOwner && Number(emailOwner.id) !== Number(id)) {
      throw new AppError("Email is already in use", 409);
    }
  }

  const data = omitUndefined({
    email: payload.email,
    role: payload.role,
    is_active: payload.is_active,
    password_hash: payload.password ? await bcrypt.hash(payload.password, 12) : undefined,
  });

  const user = await userRepository.update(id, data);
  return sanitizeUser(user);
};

export const softDeleteUser = async (id) => {
  const user = await userRepository.softDelete(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

