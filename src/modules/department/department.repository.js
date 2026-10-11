import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "departments";

export const create = async (data) => {
  const query = buildInsert(TABLE, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0];
};

export const findAll = async (limit = 20, offset = 0, departmentId = null) => {
  const values = [limit, offset];
  let whereClause = "";

  if (departmentId !== null && departmentId !== undefined) {
    whereClause = "WHERE id = $3";
    values.push(departmentId);
  }

  const result = await pool.query(
    `SELECT * FROM ${TABLE} ${whereClause} ORDER BY name ASC LIMIT $1 OFFSET $2`,
    values
  );
  
  const countQuery = departmentId 
    ? `SELECT COUNT(*)::int as total FROM ${TABLE} WHERE id = $1` 
    : `SELECT COUNT(*)::int as total FROM ${TABLE}`;
  const countValues = departmentId ? [departmentId] : [];

  const countResult = await pool.query(countQuery, countValues);
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
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
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
