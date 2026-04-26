import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "users";
const SAFE_COLUMNS = "id, email, role, is_active, created_at, updated_at";

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
    `SELECT ${SAFE_COLUMNS}
     FROM ${TABLE}
     ORDER BY id DESC`
  );
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT ${SAFE_COLUMNS}
     FROM ${TABLE}
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE LOWER(email) = LOWER($1)`, [email]);
  return result.rows[0] || null;
};

export const update = async (id, data) => {
  const query = buildUpdate(TABLE, id, data, { touchUpdatedAt: true });
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
};

export const softDelete = async (id) => {
  const result = await pool.query(
    `UPDATE ${TABLE}
     SET is_active = false, updated_at = NOW()
     WHERE id = $1
     RETURNING ${SAFE_COLUMNS}`,
    [id]
  );
  return result.rows[0] || null;
};


