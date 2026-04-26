import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import { ADMIN, STUDENT, TEACHER } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import * as authRepository from "./auth.repository.js";

const GENERIC_AUTH_ERROR = "Invalid credentials";

const issueToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: "1d" });

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  is_active: user.is_active,
  password_changed: user.password_changed,
});

const assertActive = (user) => {
  if (!user.is_active) {
    throw new AppError("Account is deactivated", 403);
  }
};

// ── Shared bcrypt login helper ────────────────────────────────────────────────

const verifyPassword = async (plain, hash) => {
  const valid = await bcrypt.compare(plain, hash);
  if (!valid) throw new AppError(GENERIC_AUTH_ERROR, 401);
};

// ── Admin login ───────────────────────────────────────────────────────────────

export const loginAdmin = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user || user.role !== ADMIN) {
    throw new AppError(GENERIC_AUTH_ERROR, 401);
  }

  assertActive(user);
  await verifyPassword(password, user.password_hash);

  return { token: issueToken(user), user: sanitizeUser(user) };
};

// ── Student login ─────────────────────────────────────────────────────────────
// Initial password = roll_number  |  After reset = custom password

export const loginStudent = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user || user.role !== STUDENT) {
    throw new AppError(GENERIC_AUTH_ERROR, 401);
  }

  assertActive(user);
  await verifyPassword(password, user.password_hash);

  return { token: issueToken(user), user: sanitizeUser(user) };
};

// ── Teacher login ─────────────────────────────────────────────────────────────
// Initial password = employee_id  |  After reset = custom password

export const loginTeacher = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user || user.role !== TEACHER) {
    throw new AppError(GENERIC_AUTH_ERROR, 401);
  }

  assertActive(user);
  await verifyPassword(password, user.password_hash);

  return { token: issueToken(user), user: sanitizeUser(user) };
};

// ── One-time password reset (student / teacher only) ─────────────────────────

export const resetPassword = async (userId, role, newPassword) => {
  if (role === ADMIN) {
    throw new AppError("Admins cannot use this endpoint", 403);
  }

  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.password_changed) {
    throw new AppError(
      "Password has already been changed. Contact an admin to reset it.",
      403,
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await authRepository.setPassword(userId, passwordHash);
};
