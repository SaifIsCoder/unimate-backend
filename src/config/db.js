import pkg from "pg";
import env from "./env.js";
import * as logger from "./logger.js";

const { Pool } = pkg;

const getSslConfig = () => {
  // If explicitly disabled (e.g. local PostgreSQL in Docker)
  if (process.env.DB_SSL === "false" || env.databaseUrl?.includes("sslmode=disable")) {
    return false;
  }
  // If custom CA certificate is provided for strict validation
  if (process.env.DB_CA_CERT) {
    return {
      rejectUnauthorized: true,
      ca: process.env.DB_CA_CERT,
    };
  }
  // If strict certificate verification requested via environment variable
  if (process.env.DB_SSL_REJECT_UNAUTHORIZED === "true") {
    return { rejectUnauthorized: true };
  }
  // Default for Supabase pooler on AWS: pooler endpoints use wildcard/SNI certificates
  // requiring rejectUnauthorized: false unless the custom Supabase Root CA is supplied.
  return { rejectUnauthorized: false };
};

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: getSslConfig(),
  // Supabase free-tier allows ~60 direct connections; Render instances share
  // the pool, so keep this conservative.
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
});

// Log pool-level errors so they don't crash the process silently.
pool.on("error", (err) => {
  logger.error({ err, event: "PG_POOL_ERROR" }, "Unexpected PostgreSQL pool error");
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

/**
 * Gracefully close the pool. Called during SIGTERM / SIGINT shutdown.
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info("PostgreSQL connection pool closed");
  } catch (err) {
    logger.error({ err }, "Error closing PostgreSQL pool");
  }
};
