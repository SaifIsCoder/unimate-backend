import { pool } from "../../config/db.js";
import { buildInsert } from "../../utils/sql.helpers.js";

const SESSIONS_TABLE = "attendance_sessions";
const RECORDS_TABLE = "attendance_records";

export const upsertSession = async (offeringId, date, client = pool) => {
  const query = `
    INSERT INTO ${SESSIONS_TABLE} (offering_id, date)
    VALUES ($1, $2)
    ON CONFLICT (offering_id, date) DO UPDATE SET date = EXCLUDED.date
    RETURNING *;
  `;
  const result = await client.query(query, [offeringId, date]);
  return result.rows[0];
};

export const getSessionById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${SESSIONS_TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const getRecordsBySession = async (sessionId, client = pool) => {
  const result = await client.query(
    `SELECT ar.*, s.roll_number, u.email
     FROM ${RECORDS_TABLE} ar
     JOIN students s ON s.id = ar.student_id
     JOIN users u ON u.id = s.user_id
     WHERE ar.session_id = $1`,
    [sessionId]
  );
  return result.rows;
};

export const bulkUpsertRecords = async (sessionId, records, client = pool) => {
  if (!records || records.length === 0) return [];

  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const record of records) {
    values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    params.push(sessionId, record.student_id, record.status);
  }

  const query = `
    INSERT INTO ${RECORDS_TABLE} (session_id, student_id, status)
    VALUES ${values.join(", ")}
    ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status
    RETURNING *;
  `;

  const result = await client.query(query, params);
  return result.rows;
};

export const getAttendanceStats = async (offeringId, client = pool) => {
  // Get total lectures (sessions)
  const sessionResult = await client.query(
    `SELECT COUNT(*)::int AS total_lectures FROM ${SESSIONS_TABLE} WHERE offering_id = $1`,
    [offeringId]
  );
  const totalLectures = sessionResult.rows[0].total_lectures;

  // Get student attendance counts
  const query = `
    SELECT 
      ar.student_id,
      s.roll_number,
      COUNT(*) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(*) FILTER (WHERE ar.status = 'absent') AS absent_count,
      COUNT(*) FILTER (WHERE ar.status = 'late') AS late_count,
      COUNT(*) FILTER (WHERE ar.status = 'leave') AS leave_count
    FROM ${RECORDS_TABLE} ar
    JOIN ${SESSIONS_TABLE} sess ON sess.id = ar.session_id
    JOIN students s ON s.id = ar.student_id
    WHERE sess.offering_id = $1
    GROUP BY ar.student_id, s.roll_number
  `;
  const result = await client.query(query, [offeringId]);

  return {
    totalLectures,
    studentStats: result.rows,
  };
};
