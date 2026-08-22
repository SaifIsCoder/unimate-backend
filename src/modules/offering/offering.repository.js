import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "course_offerings";

export const create = async (data) => {
  const query = buildInsert(TABLE, data);
  const result = await pool.query(query.text, query.values);
  return result.rows[0];
};

export const findAll = async (filters = {}, limit = 20, offset = 0) => {
  const conditions = [];
  const values = [];

  if (filters.semester) {
    values.push(filters.semester);
    conditions.push(`co.semester = $${values.length}`);
  }

  if (filters.course_id) {
    values.push(filters.course_id);
    conditions.push(`co.course_id = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  
  // Clone values array for the count query before adding limit/offset
  const countValues = [...values];
  
  values.push(limit, offset);
  
  const result = await pool.query(
    `SELECT co.*, c.code AS course_code, c.title AS course_title,
            t.id AS teacher_profile_id, u.email AS teacher_email
     FROM course_offerings co
     JOIN courses c ON c.id = co.course_id
     LEFT JOIN teachers t ON t.id = co.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     ${whereClause}
     ORDER BY co.id DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const countResult = await pool.query(`SELECT COUNT(*)::int as total FROM course_offerings co ${whereClause}`, countValues);
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
    `SELECT co.*, c.code AS course_code, c.title AS course_title, c.has_practical,
            t.id AS teacher_profile_id, u.email AS teacher_email
     FROM course_offerings co
     JOIN courses c ON c.id = co.course_id
     LEFT JOIN teachers t ON t.id = co.teacher_id
     LEFT JOIN users u ON u.id = t.user_id
     WHERE co.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const findByIdWithCourseDetails = async (id) => {
  const query = `
    SELECT co.*, c.has_practical 
    FROM course_offerings co 
    JOIN courses c ON c.id = co.course_id 
    WHERE co.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

export const findPlainById = async (id, client = pool, options = {}) => {
  const lockClause = options.forUpdate ? " FOR UPDATE" : "";
  const result = await client.query(`SELECT * FROM ${TABLE} WHERE id = $1${lockClause}`, [id]);
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
