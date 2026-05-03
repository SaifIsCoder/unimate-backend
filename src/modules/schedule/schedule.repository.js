import { pool } from "../../config/db.js";
import { buildInsert, buildUpdate } from "../../utils/sql.helpers.js";

const SCHEDULES_TABLE = "schedules";
const EXCEPTIONS_TABLE = "schedule_exceptions";

// SCHEDULES

export const createSchedule = async (data, client = pool) => {
  const query = buildInsert(SCHEDULES_TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const findSchedulesByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${SCHEDULES_TABLE} WHERE offering_id = $1 ORDER BY day_of_week, start_time`,
    [offeringId]
  );
  return result.rows;
};

export const findScheduleById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${SCHEDULES_TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const deleteSchedule = async (id, client = pool) => {
  const result = await client.query(`DELETE FROM ${SCHEDULES_TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};

// EXCEPTIONS

export const createException = async (data, client = pool) => {
  const query = buildInsert(EXCEPTIONS_TABLE, data);
  const result = await client.query(query.text, query.values);
  return result.rows[0];
};

export const findExceptionsByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${EXCEPTIONS_TABLE} WHERE offering_id = $1 ORDER BY date DESC`,
    [offeringId]
  );
  return result.rows;
};

export const findExceptionById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${EXCEPTIONS_TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const deleteException = async (id, client = pool) => {
  const result = await client.query(`DELETE FROM ${EXCEPTIONS_TABLE} WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
