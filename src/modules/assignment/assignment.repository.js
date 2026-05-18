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

// ── Mobile Student Assignment Queries ─────────────────────────────────────────────

export const findAssignmentsByStudent = async (studentId, client = pool) => {
  const query = `
    SELECT 
      a.id,
      a.title,
      c.code AS course_code,
      c.title AS course_title,
      a.due_date AS due,
      COALESCE(sa.progress, 0) AS progress,
      a.difficulty,
      a.priority,
      COALESCE(sa.status, 'pending') AS status,
      a.assessment_type AS type,
      a.total_points AS max_marks,
      g.score AS marks,
      (g.id IS NOT NULL) AS is_graded,
      sa.file_url,
      sa.text_content,
      sa.submitted_at
    FROM enrollments e
    JOIN course_offerings co ON co.id = e.offering_id
    JOIN courses c ON c.id = co.course_id
    JOIN assignments a ON a.offering_id = co.id
    LEFT JOIN student_assignments sa ON sa.assignment_id = a.id AND sa.student_id = e.student_id
    LEFT JOIN grades g ON g.enrollment_id = e.id AND g.reference_id = a.id AND g.assessment_type = a.assessment_type
    WHERE e.student_id = $1 AND e.status = 'enrolled'
    ORDER BY a.due_date ASC
  `;
  const result = await client.query(query, [studentId]);
  return result.rows;
};

export const upsertAssignmentProgress = async (studentId, assignmentId, progress, status, client = pool) => {
  const query = `
    INSERT INTO student_assignments (student_id, assignment_id, progress, status, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (student_id, assignment_id)
    DO UPDATE SET 
      progress = EXCLUDED.progress,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await client.query(query, [studentId, assignmentId, progress, status]);
  return result.rows[0];
};

export const upsertAssignmentSubmission = async (studentId, assignmentId, fileUrl, textContent, client = pool) => {
  const query = `
    INSERT INTO student_assignments (student_id, assignment_id, progress, status, file_url, text_content, submitted_at, updated_at)
    VALUES ($1, $2, 100, 'done', $3, $4, NOW(), NOW())
    ON CONFLICT (student_id, assignment_id)
    DO UPDATE SET 
      progress = 100,
      status = 'done',
      file_url = EXCLUDED.file_url,
      text_content = EXCLUDED.text_content,
      submitted_at = NOW(),
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await client.query(query, [studentId, assignmentId, fileUrl || null, textContent || null]);
  return result.rows[0];
};

export const findAssignmentDetailsForStudent = async (assignmentId, studentId, client = pool) => {
  const query = `
    SELECT 
      a.id,
      a.title,
      a.description AS instructions,
      a.due_date AS due,
      a.total_points AS max_marks,
      a.difficulty,
      a.priority,
      COALESCE(sa.status, 'pending') AS status,
      COALESCE(sa.progress, 0) AS progress,
      sa.file_url,
      sa.text_content,
      sa.submitted_at,
      g.score AS marks,
      g.title AS grade_title,
      (g.id IS NOT NULL) AS is_graded
    FROM assignments a
    LEFT JOIN student_assignments sa ON sa.assignment_id = a.id AND sa.student_id = $2
    LEFT JOIN enrollments e ON e.offering_id = a.offering_id AND e.student_id = $2
    LEFT JOIN grades g ON g.enrollment_id = e.id AND g.reference_id = a.id AND g.assessment_type = a.assessment_type
    WHERE a.id = $1
  `;
  const result = await client.query(query, [assignmentId, studentId]);
  return result.rows[0] || null;
};

export const deleteAssignmentSubmission = async (studentId, assignmentId, client = pool) => {
  const query = `
    DELETE FROM student_assignments 
    WHERE student_id = $1 AND assignment_id = $2 
    RETURNING *;
  `;
  const result = await client.query(query, [studentId, assignmentId]);
  return result.rows[0] || null;
};
