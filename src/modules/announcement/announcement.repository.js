import { pool } from "../../config/db.js";

export const createAnnouncement = async (data, client = pool) => {
  const query = `
    INSERT INTO announcements (author_id, title, content, department_id, semester)
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const result = await client.query(query, [
    data.author_id,
    data.title,
    data.content,
    data.department_id || null,
    data.semester || null,
  ]);
  return result.rows[0];
};

export const addOfferingTargets = async (announcementId, offeringIds, client = pool) => {
  const values = offeringIds.flatMap((oid) => [announcementId, oid]);
  const placeholders = offeringIds
    .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
    .join(", ");
  const query = `INSERT INTO announcement_offerings (announcement_id, offering_id) VALUES ${placeholders}`;
  await client.query(query, values);
};

export const findOfferingIdsByAnnouncementId = async (
  announcementId,
  client = pool,
) => {
  const result = await client.query(
    `SELECT offering_id FROM announcement_offerings WHERE announcement_id = $1`,
    [announcementId],
  );
  return result.rows.map((r) => r.offering_id);
};

export const getByOffering = async (
  offeringId,
  { page = 1, limit = 20 } = {},
) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT a.* FROM announcements a
    LEFT JOIN announcement_offerings ao ON ao.announcement_id = a.id
    WHERE ao.offering_id = $1
    ORDER BY a.created_at DESC LIMIT $2 OFFSET $3
  `;
  const result = await pool.query(query, [offeringId, limit, offset]);

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM announcement_offerings WHERE offering_id = $1`,
    [offeringId],
  );

  return {
    data: result.rows,
    meta: { total: countRes.rows[0].total, page, limit },
  };
};

export const getBySemester = async (
  semester,
  { page = 1, limit = 20 } = {},
) => {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT * FROM announcements WHERE semester = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [semester, limit, offset],
  );

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM announcements WHERE semester = $1`,
    [semester],
  );

  return {
    data: result.rows,
    meta: { total: countRes.rows[0].total, page, limit },
  };
};

export const getByDepartment = async (
  departmentId,
  { page = 1, limit = 20 } = {},
) => {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT * FROM announcements WHERE department_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [departmentId, limit, offset],
  );

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM announcements WHERE department_id = $1`,
    [departmentId],
  );

  return {
    data: result.rows,
    meta: { total: countRes.rows[0].total, page, limit },
  };
};

export const findById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM announcements WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

export const updateAnnouncement = async (id, data, client = pool) => {
  const fields = [];
  const values = [];
  let index = 1;
  
  if (data.title) {
    fields.push(`title = $${index++}`);
    values.push(data.title);
  }
  if (data.content) {
    fields.push(`content = $${index++}`);
    values.push(data.content);
  }
  
  if (fields.length === 0) return null;
  
  values.push(id);
  const query = `UPDATE announcements SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
  
  const result = await client.query(query, values);
  return result.rows[0];
};

export const deleteAnnouncement = async (id, client = pool) => {
  const result = await client.query(`DELETE FROM announcements WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
};
