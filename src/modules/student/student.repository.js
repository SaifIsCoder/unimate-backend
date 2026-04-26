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
export const findAll = async () => {
  const result = await pool.query(
    `SELECT s.*, u.email, u.role
     FROM students s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC`
  );
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT s.*, u.email, u.role
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByUserId = async (userId) => {
  console.log("repository",userId);
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id = $1`, [userId]);
  
  console.log("repository",result.rows);

  return result.rows[0] || null;

};

export const update = async (id, data) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
};

export const getEnrollments = async (studentId) => {
  const result = await pool.query(
    `SELECT e.*, co.semester, co.section, c.id AS course_id, c.code AS course_code, c.title AS course_title
     FROM enrollments e
     JOIN course_offerings co ON co.id = e.offering_id
     JOIN courses c ON c.id = co.course_id
     WHERE e.student_id = $1
     ORDER BY e.id DESC`,
    [studentId]
  );
  return result.rows;
};
