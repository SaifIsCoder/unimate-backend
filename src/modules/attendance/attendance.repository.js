import { pool } from "../../config/db.js";
import { buildInsert } from "../../utils/sql.helpers.js";

const SESSIONS_TABLE = "attendance_sessions";
const RECORDS_TABLE = "attendance_records";

export const upsertSession = async (offeringId, date, extra = {}, client = pool) => {
  const { schedule_id = null, exception_id = null } = extra;
  const query = `
    INSERT INTO ${SESSIONS_TABLE} (offering_id, date, schedule_id, exception_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (offering_id, date) DO UPDATE 
    SET schedule_id = COALESCE(EXCLUDED.schedule_id, ${SESSIONS_TABLE}.schedule_id),
        exception_id = COALESCE(EXCLUDED.exception_id, ${SESSIONS_TABLE}.exception_id)
    RETURNING *;
  `;
  const result = await client.query(query, [offeringId, date, schedule_id, exception_id]);
  return result.rows[0];
};

export const getSessionById = async (id, client = pool) => {
  const result = await client.query(`SELECT * FROM ${SESSIONS_TABLE} WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

export const getSessionsByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${SESSIONS_TABLE} WHERE offering_id = $1 ORDER BY date DESC`,
    [offeringId]
  );
  return result.rows;
};

export const getRecordsBySession = async (sessionId, client = pool) => {
  const result = await client.query(
    `SELECT ar.*, s.roll_number, u.email
     FROM ${RECORDS_TABLE} ar
     JOIN enrollments e ON e.id = ar.enrollment_id
     JOIN students s ON s.id = e.student_id
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
    params.push(sessionId, record.enrollment_id, record.status);
  }

  const query = `
    INSERT INTO ${RECORDS_TABLE} (session_id, enrollment_id, status)
    VALUES ${values.join(", ")}
    ON CONFLICT (session_id, enrollment_id) DO UPDATE SET status = EXCLUDED.status
    RETURNING *;
  `;

  const result = await client.query(query, params);
  return result.rows;
};

export const getAttendanceStats = async (offeringId, { page = 1, limit = 50 } = {}, client = pool) => {
  const offset = (page - 1) * limit;

  // Get total lectures (sessions) - this remains a single value
  const sessionResult = await client.query(
    `SELECT COUNT(*)::int AS total_lectures FROM ${SESSIONS_TABLE} WHERE offering_id = $1`,
    [offeringId]
  );
  const totalLectures = sessionResult.rows[0].total_lectures;

  // Get student attendance counts with pagination
  const query = `
    SELECT 
      e.student_id,
      s.roll_number,
      COUNT(*) FILTER (WHERE ar.status = 'present') AS present_count,
      COUNT(*) FILTER (WHERE ar.status = 'absent') AS absent_count,
      COUNT(*) FILTER (WHERE ar.status = 'late') AS late_count,
      COUNT(*) FILTER (WHERE ar.status = 'leave') AS leave_count
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    LEFT JOIN ${RECORDS_TABLE} ar ON e.id = ar.enrollment_id
    LEFT JOIN ${SESSIONS_TABLE} sess ON sess.id = ar.session_id AND sess.offering_id = $1
    WHERE e.offering_id = $1
    GROUP BY e.student_id, s.roll_number
    ORDER BY s.roll_number ASC
    LIMIT $2 OFFSET $3
  `;
  const result = await client.query(query, [offeringId, limit, offset]);

  const countRes = await client.query(
    `SELECT COUNT(*)::int AS total FROM enrollments WHERE offering_id = $1`,
    [offeringId]
  );

  return {
    totalLectures,
    studentStats: {
      data: result.rows,
      meta: { total: countRes.rows[0].total, page, limit }
    },
  };
};
