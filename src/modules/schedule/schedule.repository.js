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

// ── Mobile Student Schedule Queries ──────────────────────────────────────────────

export const findSchedulesByStudent = async (studentId, client = pool) => {
  const query = `
    SELECT 
      s.id AS schedule_id,
      s.day_of_week,
      s.start_time,
      s.end_time,
      s.room,
      co.id AS offering_id,
      co.section,
      co.semester,
      c.id AS course_id,
      c.code AS course_code,
      c.title AS course_title,
      u_t.email AS teacher_email
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN schedules s ON s.offering_id = co.id
    LEFT JOIN teachers t ON t.id = co.teacher_id
    LEFT JOIN users u_t ON u_t.id = t.user_id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    ORDER BY s.day_of_week, s.start_time
  `;
  const result = await client.query(query, [studentId]);
  return result.rows;
};

export const findExceptionsByStudent = async (studentId, client = pool) => {
  const query = `
    SELECT 
      se.id AS exception_id,
      se.schedule_id,
      se.date,
      se.exception_type,
      se.new_start_time,
      se.new_end_time,
      se.new_room,
      co.id AS offering_id,
      c.code AS course_code,
      c.title AS course_title
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN schedule_exceptions se ON se.offering_id = co.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    ORDER BY se.date DESC
  `;
  const result = await client.query(query, [studentId]);
  return result.rows;
};
