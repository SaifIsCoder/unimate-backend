import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "enrollments";

const SELECT_WITH_DETAILS = `
  SELECT e.*, s.user_id AS student_user_id, s.roll_number, s.department, s.batch, u.email AS student_email,
         co.semester, co.section, c.id AS course_id,
         c.code AS course_code, c.title AS course_title
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN users u ON u.id = s.user_id
  JOIN course_offerings co ON co.id = e.offering_id
  JOIN courses c ON c.id = co.course_id
`;

export const create = async (data, client = pool) => {
  const query = buildInsert(TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const findAll = async () => {
  const result = await pool.query(`${SELECT_WITH_DETAILS} ORDER BY e.id DESC`);
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(`${SELECT_WITH_DETAILS} WHERE e.id = $1`, [id]);
  return result.rows[0] || null;
};

export const findPlainById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const findByStudentAndOffering = async (studentId, offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE}
     WHERE student_id = $1 AND offering_id = $2
     LIMIT 1`,
    [studentId, offeringId]
  );
  return result.rows[0] || null;
};

export const countActiveByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM ${TABLE}
     WHERE offering_id = $1 AND status IN ('pending', 'enrolled')`,
    [offeringId]
  );
  return result.rows[0].total;
};

export const findByStudent = async (studentId) => {
  const result = await pool.query(
    `${SELECT_WITH_DETAILS}
     WHERE e.student_id = $1
     ORDER BY e.id DESC`,
    [studentId]
  );
  return result.rows;
};

export const findByOffering = async (offeringId) => {
  const result = await pool.query(
    `${SELECT_WITH_DETAILS}
     WHERE e.offering_id = $1
     ORDER BY e.id DESC`,
    [offeringId]
  );
  return result.rows;
};

export const update = async (id, data, client = pool) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0] || null;
};

export const remove = async (id) => {
  const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
