import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "courses";

export const create = async (data) => {
  const query = buildInsert(TABLE, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0];
};

export const findAll = async (limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT c.*, d.name AS department_name, d.code AS department_code
     FROM courses c
     LEFT JOIN departments d ON d.id = c.department_id
     ORDER BY c.id DESC
     LIMIT $1 OFFSET $2`,
     [limit, offset]
  );
  
  const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM courses`);
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
    `SELECT c.*, d.name AS department_name, d.code AS department_code
     FROM courses c
     LEFT JOIN departments d ON d.id = c.department_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByCode = async (code) => {
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE LOWER(code) = LOWER($1)`, [code]);
  return result.rows[0] || null;
};

export const update = async (id, data) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0] || null;
};

export const remove = async (id) => {
  const result = await pool.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
