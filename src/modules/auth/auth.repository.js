import { pool } from "../../config/db.js";

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return result.rows[0] || null;
};

export const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export const findStudentByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM students WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

export const findTeacherByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM teachers WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};


export const findStudentByEmailAndRollNumber = async (email, rollNumber) => {
  const result = await pool.query(
    `SELECT u.*, s.roll_number
     FROM users u
     JOIN students s ON s.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
       AND LOWER(s.roll_number) = LOWER($2)
       AND u.role = 'student'`,
    [email, rollNumber],
  );
  return result.rows[0] || null;
};

export const findTeacherByEmailAndEmployeeId = async (email, employeeId) => {
  const result = await pool.query(
    `SELECT u.*, t.employee_id
     FROM users u
     JOIN teachers t ON t.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
       AND LOWER(t.employee_id) = LOWER($2)
       AND u.role = 'teacher'`,
    [email, employeeId],
  );
  return result.rows[0] || null;
};

export const setPassword = async (userId, passwordHash) => {
  const result = await pool.query(
    `UPDATE users
     SET password_hash = $1, password_changed = true, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, role, is_active, password_changed`,
    [passwordHash, userId],
  );
  return result.rows[0] || null;
};
