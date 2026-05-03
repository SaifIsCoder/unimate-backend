import { pool } from "../../config/db.js";

const TABLE = "grades";

export const upsertGrade = async (data, client = pool) => {
  if (data.assessment_type === "assignment" && data.reference_id) {
    const query = `
      INSERT INTO ${TABLE} (enrollment_id, assessment_type, reference_id, title, score, max_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (enrollment_id, reference_id) WHERE reference_id IS NOT NULL
      DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, title = EXCLUDED.title
      RETURNING *;
    `;
    const result = await client.query(query, [
      data.enrollment_id,
      data.assessment_type,
      data.reference_id,
      data.title,
      data.score,
      data.max_score,
    ]);
    return result.rows[0];
  } else {
    const query = `
      INSERT INTO ${TABLE} (enrollment_id, assessment_type, reference_id, title, score, max_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (enrollment_id, assessment_type) WHERE reference_id IS NULL AND assessment_type != 'assignment'
      DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, title = EXCLUDED.title
      RETURNING *;
    `;
    const result = await client.query(query, [
      data.enrollment_id,
      data.assessment_type,
      data.reference_id || null,
      data.title,
      data.score,
      data.max_score,
    ]);
    return result.rows[0];
  }
};

export const findGradesByOffering = async (offeringId, client = pool) => {
  const result = await client.query(
    `SELECT g.*, s.roll_number, u.email
     FROM ${TABLE} g
     JOIN enrollments e ON e.id = g.enrollment_id
     JOIN students s ON s.id = e.student_id
     JOIN users u ON u.id = s.user_id
     WHERE e.offering_id = $1
     ORDER BY s.roll_number ASC, g.assessment_type ASC`,
    [offeringId]
  );
  return result.rows;
};

export const findGradesByStudentAndOffering = async (studentId, offeringId, client = pool) => {
  const result = await client.query(
    `SELECT g.* FROM ${TABLE} g
     JOIN enrollments e ON e.id = g.enrollment_id
     WHERE e.student_id = $1 AND e.offering_id = $2`,
    [studentId, offeringId]
  );
  return result.rows;
};

export const findTranscriptDataForStudent = async (studentId, client = pool) => {
  const query = `
    SELECT 
      g.*, 
      co.id AS offering_id,
      co.semester,
      c.code AS course_code,
      c.title AS course_title,
      c.credit_hours,
      c.has_practical
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    LEFT JOIN ${TABLE} g ON g.enrollment_id = e.id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
  `;
  const result = await client.query(query, [studentId]);
  return result.rows;
};
