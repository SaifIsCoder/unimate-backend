import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const TABLE = "assignments";

export const createAssignment = async (data, client = pool) => {
  const query = buildInsert(TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const findAssignmentsByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE} WHERE offering_id = $1 ORDER BY due_date ASC`,
    [offeringId]
  );
  return result.rows;
};

export const findDuplicateAssignment = async (offeringId, title, description, excludeId = null, client = pool) => {
  let queryText = `SELECT * FROM ${TABLE} WHERE offering_id = $1 AND title = $2 AND (COALESCE(description, '') = COALESCE($3, ''))`;
  const params = [offeringId, title, description || null];

  if (excludeId) {
    queryText += ` AND id != $4`;
    params.push(excludeId);
  }

  const result = await client.query(queryText, params);
  return result.rows[0] || null;
};

export const findAssignmentById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const deleteAssignment = async (id, client = pool) => {
  const result = await client.query(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};

export const updateAssignment = async (id, data, client = pool) => {
  const query = buildUpdate(TABLE, id, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0] || null;
};
