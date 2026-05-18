import { pool } from "../../config/db.js";

export const bulkCreateNotifications = async (notifications, client = pool) => {
  if (!notifications.length) return [];
  
  const values = [];
  const params = [];
  let index = 1;

  for (const n of notifications) {
    values.push(`($${index++}, $${index++}, $${index++}, $${index++}, $${index++})`);
    params.push(n.user_id, n.type, n.title, n.message, n.reference_id || null);
  }

  const query = `
    INSERT INTO notifications (user_id, type, title, message, reference_id)
    VALUES ${values.join(", ")} RETURNING *;
  `;
  const result = await client.query(query, params);
  return result.rows;
};

export const getFcmTokensForUsers = async (userIds, client = pool) => {
  if (!userIds.length) return [];
  
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
  const query = `SELECT token FROM fcm_tokens WHERE user_id IN (${placeholders})`;
  
  const result = await client.query(query, userIds);
  return result.rows.map(row => row.token);
};

export const registerFcmToken = async (userId, token, client = pool) => {
  const query = `
    INSERT INTO fcm_tokens (user_id, token)
    VALUES ($1, $2)
    ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING *;
  `;
  const result = await client.query(query, [userId, token]);
  return result.rows[0];
};

export const getUserNotifications = async (userId, limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

export const markAsRead = async (id, userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
};

export const markAllAsRead = async (userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 RETURNING *`,
    [userId]
  );
  return result.rows;
};
