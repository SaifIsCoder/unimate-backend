import { pool } from "../../config/db.js";

export const findUpcomingEvents = async (limit = 1, client = pool) => {
  const query = `
    SELECT id, title, description, date, location, created_at, updated_at
    FROM events
    WHERE date >= NOW()
    ORDER BY date ASC
    LIMIT $1
  `;
  const result = await client.query(query, [limit]);
  return result.rows;
};
