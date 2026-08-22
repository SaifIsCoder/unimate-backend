import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "admins";

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

export const findAll = async (limit = 20, offset = 0, client = pool) => {
  const result = await client.query(
    `SELECT a.*, u.email, u.role, u.is_active, d.name AS department_name, d.code AS department_code
     FROM admins a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN departments d ON d.id = a.department_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
     [limit, offset]
  );
  
  const countResult = await client.query(`SELECT COUNT(*)::int as total FROM admins`);
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
    `SELECT a.*, u.email, u.role, u.is_active, d.name AS department_name, d.code AS department_code
     FROM admins a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN departments d ON d.id = a.department_id
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT a.*, u.email, u.role, u.is_active, d.name AS department_name, d.code AS department_code
     FROM admins a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN departments d ON d.id = a.department_id
     WHERE a.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

export const update = async (id, data) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
};

export const remove = async (id) => {
  const result = await pool.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};
