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

export const findAll = async () => {
  const result = await pool.query(
    `SELECT t.*, u.email, u.role
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     ORDER BY t.id DESC`
  );
  return result.rows;
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

export const findByUserId = async (userId) => {
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE user_id = $1`, [userId]);
  return result.rows[0] || null;
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
