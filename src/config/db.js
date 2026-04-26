import pkg from "pg";
import env from "./env.js";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: env.databaseUrl,

  ssl: {
    rejectUnauthorized: false, // required for Supabase
  },

  max: 10, // connection pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

export const testDbConnection = async () => {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is missing from the environment");
  }

  try {
    const result = await pool.query("SELECT NOW() AS now");
    return result.rows[0];
  } catch (error) {
    if (error.code === "28P01") {
      error.message =
        "Database authentication failed. Re-copy the exact connection string from Supabase Connect, or reset the database password and update DATABASE_URL.";
    }

    throw error;
  }
};
