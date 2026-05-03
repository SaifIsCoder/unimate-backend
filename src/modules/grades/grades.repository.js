import { pool } from "../../config/db.js";

const TABLE = "grades";

export const upsertGrade = async (data, client = pool) => {
  // If it's an assignment, uniqueness is based on student_id and reference_id
  if (data.assessment_type === "assignment" && data.reference_id) {
    const query = `
      INSERT INTO ${TABLE} (offering_id, student_id, assessment_type, reference_id, title, score, max_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (student_id, reference_id) WHERE reference_id IS NOT NULL
      DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, title = EXCLUDED.title
      RETURNING *;
    `;
    const result = await client.query(query, [
      data.offering_id,
      data.student_id,
      data.assessment_type,
      data.reference_id,
      data.title,
      data.score,
      data.max_score,
    ]);
    return result.rows[0];
  } else {
    // For other assessments, uniqueness is based on offering_id, student_id, assessment_type
    const query = `
      INSERT INTO ${TABLE} (offering_id, student_id, assessment_type, reference_id, title, score, max_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (offering_id, student_id, assessment_type) WHERE reference_id IS NULL AND assessment_type != 'assignment'
      DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, title = EXCLUDED.title
      RETURNING *;
    `;
    const result = await client.query(query, [
      data.offering_id,
      data.student_id,
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
     JOIN students s ON s.id = g.student_id
     JOIN users u ON u.id = s.user_id
     WHERE g.offering_id = $1
     ORDER BY s.roll_number ASC, g.assessment_type ASC`,
    [offeringId]
  );
  return result.rows;
};

export const findGradesByStudentAndOffering = async (studentId, offeringId, client = pool) => {
  const result = await client.query(
    `SELECT * FROM ${TABLE}
     WHERE student_id = $1 AND offering_id = $2`,
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
    LEFT JOIN ${TABLE} g ON g.offering_id = co.id AND g.student_id = e.student_id
    WHERE e.student_id = $1 AND e.status = 'enrolled'
  `;
  const result = await client.query(query, [studentId]);
  return result.rows;
};
