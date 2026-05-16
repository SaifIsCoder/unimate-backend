import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "students";

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
export const findAll = async (client = pool) => {
  const result = await client.query(
    `SELECT s.*, u.email, u.role, d.name AS department_name, d.code AS department_code
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN departments d ON d.id = s.department_id
     ORDER BY s.id DESC`,
  );
  return result.rows;
};

export const findById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT s.*, u.email, u.role, d.name AS department_name, d.code AS department_code
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE s.id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export const findByUserId = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE} WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

export const findByDepartmentId = async (departmentId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE} WHERE department_id = $1`,
    [departmentId],
  );
  return result.rows;
};

export const update = async (id, data, client = pool) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0] || null;
};


export const getEnrollments = async (studentId, client = pool) => {
  const result = await client.query(
    `SELECT e.*, co.semester, co.section, c.id AS course_id, c.code AS course_code, c.title AS course_title
     FROM enrollments e
     JOIN course_offerings co ON co.id = e.offering_id
     JOIN courses c ON c.id = co.course_id
     WHERE e.student_id = $1
     ORDER BY e.id DESC`,
    [studentId],
  );
  return result.rows;
};
export const remove = async (id, client = pool) => {
  const result = await client.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] || null;
};
export const findBySemester = async (semester, client = pool) => {
  const query = `
    SELECT 
        s.*, 
        u.email,
        d.name AS department_name,
        json_agg(json_build_object(
            'offering_id', co.id,
            'course_title', c.title,
            'course_code', c.code,
            'section', co.section,
            'teacher', u_t.email
        )) as enrollments
    FROM students s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN departments d ON d.id = s.department_id
    JOIN enrollments e ON s.id = e.student_id
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    LEFT JOIN teachers t ON t.id = co.teacher_id
    LEFT JOIN users u_t ON u_t.id = t.user_id
    WHERE co.semester = $1 AND e.status = 'enrolled'
    GROUP BY s.id, u.email, d.name;
  `;
  const result = await client.query(query, [semester]);
  return result.rows;
};
