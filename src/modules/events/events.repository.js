import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "events";

export const findUpcomingEvents = async (limit = 1, client = pool) => {
  const query = `
    SELECT id, title, description, date, location, created_at, updated_at
    FROM events
    WHERE date >= NOW()
    ORDER BY date ASC
    LIMIT $1
  `;
  const result = await client.query(query, [limit]);
  return result.rows;
};

export const findAll = async ({ page = 1, limit = 20 } = {}, client = pool) => {
  const offset = (page - 1) * limit;

  const result = await client.query(
    `SELECT id, title, description, date, location, created_at, updated_at
     FROM events
     ORDER BY date DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const countResult = await client.query(`SELECT COUNT(*)::int AS total FROM events`);

  return {
    data: result.rows,
    meta: { total: countResult.rows[0].total, page, limit },
  };
};

export const findById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT id, title, description, date, location, created_at, updated_at
     FROM events
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] || null;
};

export const create = async (data, client = pool) => {
  const query = buildInsert(TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const update = async (id, data, client = pool) => {
  const query = buildUpdate(TABLE, id, data, { touchUpdatedAt: true });
  const result = await client.query(query.text, query.values);
  return result.rows[0] || null;
};

export const remove = async (id, client = pool) => {
  const result = await client.query(
    `DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`,
    [id],
  );
  return result.rows[0] || null;
};
