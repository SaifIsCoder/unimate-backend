import { pool } from "../../config/db.js";

export const createPost = async (data, client = pool) => {
  const query = `
    INSERT INTO community_posts (author_id, department_id, title, content)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const result = await client.query(query, [
    data.author_id,
    data.department_id,
    data.title,
    data.content,
  ]);
  return result.rows[0];
};

export const getPostsByDepartment = async (
  departmentId,
  limit = 20,
  offset = 0,
) => {
  const query = `
    SELECT 
      cp.*,
      u.email as author_email,
      u.role as author_role,
      COUNT(DISTINCT pl.id) as like_count,
      COUNT(DISTINCT pc.id) as comment_count
    FROM community_posts cp
    JOIN users u ON u.id = cp.author_id
    LEFT JOIN post_likes pl ON pl.post_id = cp.id
    LEFT JOIN post_comments pc ON pc.post_id = cp.id AND pc.status != 'deleted'
    WHERE cp.department_id = $1 AND cp.status != 'deleted'
    GROUP BY cp.id, u.id
    ORDER BY cp.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [departmentId, limit, offset]);
  return result.rows;
};

export const getPostById = async (id, client = pool) => {
  const query = `
    SELECT 
      cp.*,
      u.email as author_email,
      u.role as author_role,
      COUNT(DISTINCT pl.id) as like_count
    FROM community_posts cp
    JOIN users u ON u.id = cp.author_id
    LEFT JOIN post_likes pl ON pl.post_id = cp.id
    WHERE cp.id = $1 AND cp.status != 'deleted'
    GROUP BY cp.id, u.id;
  `;
  const result = await client.query(query, [id]);
  return result.rows[0] || null;
};

export const updatePost = async (id, data, client = pool) => {
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
  if (data.status) {
    fields.push(`status = $${index++}`);
    values.push(data.status);
  }
  
  if (fields.length === 0) return null;
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const query = `UPDATE community_posts SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
  
  const result = await client.query(query, values);
  return result.rows[0];
};

export const createComment = async (data, client = pool) => {
  const query = `
    INSERT INTO post_comments (post_id, author_id, content)
    VALUES ($1, $2, $3) RETURNING *;
  `;
  const result = await client.query(query, [
    data.post_id, data.author_id, data.content
  ]);
  return result.rows[0];
};

export const getCommentsByPostId = async (postId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT 
      pc.*,
      u.email as author_email,
      u.role as author_role
    FROM post_comments pc
    JOIN users u ON u.id = pc.author_id
    WHERE pc.post_id = $1 AND pc.status != 'deleted'
    ORDER BY pc.created_at ASC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [postId, limit, offset]);

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM post_comments WHERE post_id = $1 AND status != 'deleted'`,
    [postId]
  );

  return {
    data: result.rows,
    meta: { total: countRes.rows[0].total, page, limit }
  };
};

export const getCommentById = async (id, client = pool) => {
  const result = await client.query(
    `SELECT * FROM post_comments WHERE id = $1 AND status != 'deleted'`,
    [id],
  );
  return result.rows[0] || null;
};

export const countCommentsByStudentOnPost = async (postId, studentUserId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*) FROM post_comments WHERE post_id = $1 AND author_id = $2 AND status != 'deleted'`,
    [postId, studentUserId]
  );
  return parseInt(result.rows[0].count, 10);
};

export const updateComment = async (id, data, client = pool) => {
  const fields = [];
  const values = [];
  let index = 1;
  
  if (data.content) {
    fields.push(`content = $${index++}`);
    values.push(data.content);
  }
  if (data.status) {
    fields.push(`status = $${index++}`);
    values.push(data.status);
  }
  
  if (fields.length === 0) return null;
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const query = `UPDATE post_comments SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
  
  const result = await client.query(query, values);
  return result.rows[0];
};

export const addLike = async (postId, userId, client = pool) => {
  const query = `
    INSERT INTO post_likes (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING
    RETURNING *;
  `;
  const result = await client.query(query, [postId, userId]);
  return result.rows[0] || null;
};

export const removeLike = async (postId, userId, client = pool) => {
  const query = `DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *;`;
  const result = await client.query(query, [postId, userId]);
  return result.rows[0] || null;
};
