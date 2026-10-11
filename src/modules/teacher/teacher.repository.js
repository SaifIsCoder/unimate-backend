import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "teachers";

export const create = async (data) => {
  const query = buildInsert(TABLE, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0];
};

export const createWithClient = async (client, data) => {
  const query = buildInsert(TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const findAll = async (limit = 20, offset = 0, departmentId = null, client = pool) => {
  const values = [limit, offset];
  let whereClause = "";

  if (departmentId !== null && departmentId !== undefined) {
    whereClause = "WHERE t.department_id = $3";
    values.push(departmentId);
  }

  const result = await client.query(
    `SELECT t.*, u.email, u.role, d.name AS department_name, d.code AS department_code
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN departments d ON d.id = t.department_id
     ${whereClause}
     ORDER BY t.id DESC
     LIMIT $1 OFFSET $2`,
     values
  );
  
  const countQuery = departmentId
    ? `SELECT COUNT(*)::int as total FROM teachers t WHERE t.department_id = $1`
    : `SELECT COUNT(*)::int as total FROM teachers`;
  const countValues = departmentId ? [departmentId] : [];

  const countResult = await client.query(countQuery, countValues);
  const total = countResult.rows[0].total;

  return {
    data: result.rows,
    meta: {
      total,
      limit,
      page: Math.floor(offset / limit) + 1
    }
  };
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT t.*, u.email, u.role
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByUserId = async (userId, client = pool) => {
  const result = await client.query(`SELECT * FROM ${TABLE} WHERE user_id = $1`, [userId]);
  return result.rows[0] || null;
};

export const findByDepartmentId = async (departmentId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE} WHERE department_id = $1`,
    [departmentId],
  );
  return result.rows;
};

export const update = async (id, data) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
};

export const getOfferings = async (teacherId) => {
  const result = await pool.query(
    `SELECT co.*, c.code AS course_code, c.title AS course_title
     FROM course_offerings co
     JOIN courses c ON c.id = co.course_id
     WHERE co.teacher_id = $1
     ORDER BY co.id DESC`,
    [teacherId]
  );
  return result.rows;
};
export const getTeacherAnalyticsSummary = async (teacherId, client = pool) => {
  // 1. Offerings and students count
  const statsRes = await client.query(
    `SELECT 
       COUNT(DISTINCT co.id)::int AS total_classes,
       COUNT(DISTINCT e.student_id)::int AS total_students
     FROM course_offerings co
     LEFT JOIN enrollments e ON e.offering_id = co.id AND e.status = 'enrolled'
     WHERE co.teacher_id = $1`,
    [teacherId]
  );

  // 2. Assignments count
  const assignRes = await client.query(
    `SELECT COUNT(DISTINCT a.id)::int AS total_assignments
     FROM assignments a
     JOIN course_offerings co ON a.offering_id = co.id
     WHERE co.teacher_id = $1`,
    [teacherId]
  );

  // 3. Average attendance calculation
  // (attended student-slots / total expected student-slots) * 100, attended = (present + late)
  const attRes = await client.query(
    `SELECT 
       COUNT(ar.id) FILTER (WHERE ar.status IN ('present', 'late'))::int AS attended_slots,
       COUNT(ar.id)::int AS total_slots
     FROM attendance_records ar
     JOIN attendance_sessions asess ON ar.session_id = asess.id
     JOIN course_offerings co ON asess.offering_id = co.id
     WHERE co.teacher_id = $1`,
    [teacherId]
  );

  const totalClasses = statsRes.rows[0]?.total_classes || 0;
  const totalStudents = statsRes.rows[0]?.total_students || 0;
  const totalAssignments = assignRes.rows[0]?.total_assignments || 0;
  
  const attendedSlots = attRes.rows[0]?.attended_slots || 0;
  const totalSlots = attRes.rows[0]?.total_slots || 0;
  const avgAttendance = totalSlots > 0 ? Math.round((attendedSlots / totalSlots) * 100 * 10) / 10 : 0;

  return {
    total_classes: totalClasses,
    total_students: totalStudents,
    total_assignments: totalAssignments,
    avg_attendance: avgAttendance,
  };
};

export const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
