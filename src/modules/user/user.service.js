import bcrypt from "bcryptjs";
import { SUPER_ADMIN, STUDENT, TEACHER, ADMIN } from "../../constants/roles.js";
import { AppError } from "../../utils/app-error.js";
import { omitUndefined } from "../../utils/sql.helpers.js";
import { withTransaction } from "../../utils/transaction.js";
import * as userRepository from "./user.repository.js";
import * as studentRepository from "../student/student.repository.js";
import * as teacherRepository from "../teacher/teacher.repository.js";
import * as adminRepository from "../admins/admin.repository.js";
import { pool } from "../../config/db.js";
import * as gradesRepository from "../grades/grades.repository.js";
import * as academicRules from "../../utils/academic-rules.js";
import { getPagination } from "../../utils/pagination.js";

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

export const getUsers = async (query = {}) => {
  const { page, limit, offset } = getPagination(query);
  return userRepository.findAll(limit, offset);
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

// ── Extended Self-Profile Method for Mobile dashboard ────────────────────────────

/**
 * Best-effort display name derived from the local part of an email —
 * "ali.raza@unimate.edu" becomes "Ali Raza".
 *
 * A stopgap: `users` has no name column, so this is the only source available.
 * Replace it the moment a real name field exists.
 */
const displayNameFromEmail = (email) =>
  String(email || "")
    .split("@")[0]
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getStudentOverallAttendanceHelper = async (studentId) => {
  const query = `
    SELECT 
      e.id AS enrollment_id,
      e.offering_id,
      COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(ar.id) FILTER (WHERE ar.status = 'leave') AS leave_count,
      (SELECT COUNT(*)::int FROM attendance_sessions WHERE offering_id = e.offering_id) AS total_lectures
    FROM enrollments e
    LEFT JOIN attendance_records ar ON ar.enrollment_id = e.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    GROUP BY e.id, e.offering_id
  `;
  const result = await pool.query(query, [studentId]);
  
  let totalLectures = 0;
  let totalPresent = 0;
  let totalLeaves = 0;
  
  result.rows.forEach(row => {
    totalLectures += parseInt(row.total_lectures, 10) || 0;
    totalPresent += parseInt(row.present_count, 10) || 0;
    totalLeaves += parseInt(row.leave_count, 10) || 0;
  });
  
  const overallAdjustedTotal = totalLectures - totalLeaves;
  let overallPercentage = 100.0;
  if (overallAdjustedTotal > 0) {
    overallPercentage = (totalPresent / overallAdjustedTotal) * 100;
  }
  
  return {
    averageAttendance: Number(overallPercentage.toFixed(2)),
  };
};

export const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === STUDENT) {
    const student = await studentRepository.findByUserId(userId);
    if (student) {
      // 1. Fetch transcript data to compute dynamic CGPA and credit hours
      const rawTranscript = await gradesRepository.findTranscriptDataForStudent(student.id);
      const transcript = academicRules.transformTranscriptData(rawTranscript);
      
      // 2. Fetch attendance statistics to compute average attendance
      const attendance = await getStudentOverallAttendanceHelper(student.id);

      return {
        id: user.id,
        role: user.role,
        name: user.name || displayNameFromEmail(user.email),
        registrationNumber: student.roll_number,
        cgpa: Number(transcript.cgpa.toFixed(2)) || 0.0,
        creditsEnrolled: transcript.total_credit_hours || 0,
        averageAttendance: attendance.averageAttendance || 0.0,
        program: student.program || "",
        session: student.session || "",
        section: student.section || "",
        gender: student.gender || "",
        dob: student.date_of_birth ? student.date_of_birth.toISOString().split("T")[0] : null,
        semester: student.current_semester || null,
        department: student.department?.name || "",
        personal: {
          email: user.email,
          phone: student.phone || "",
          address: student.address || "",
        },
        guardian: {
          name: student.father_name || "",
          relation: student.guardian_relation || "Father",
          phone: student.guardian_phone || "",
          emergencyPhone: student.emergency_phone || "",
        },
        targetCgpa: Number(student.target_cgpa) || 3.0,
        studyIntensity: student.study_intensity || "balanced",
      };
    }
  } else if (user.role === TEACHER) {
    const teacher = await teacherRepository.findByUserId(userId);

    return {
      id: user.id,
      role: user.role,
      name: user.name || displayNameFromEmail(user.email),
      employeeId: teacher?.employee_id || "",
      departmentId: teacher?.department_id ?? null,
      personal: {
        email: user.email,
      },
    };
  } else {
    // Admin / super_admin. This previously returned a hardcoded "A101" for
    // every administrator, so the identifier shown in the UI was the same
    // constant regardless of who signed in.
    const admin = await adminRepository.findByUserId(userId);

    return {
      id: user.id,
      role: user.role,
      name: user.name || displayNameFromEmail(user.email),
      adminId: admin?.admin_id || "",
      // Admins are department-scoped for announcements and community
      // moderation, so the client needs to know which department that is.
      departmentId: admin?.department_id ?? null,
      departmentName: admin?.department_name || "",
      personal: {
        email: user.email,
      },
    };
  }

  return sanitizeUser(user);
};

