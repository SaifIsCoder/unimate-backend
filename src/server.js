import app from "./app.js";
import env from "./config/env.js";
import * as logger from "./config/logger.js";
import { testDbConnection, closePool } from "./config/db.js";

// ── Start the HTTP server ─────────────────────────────────────────────────────

const server = app.listen(env.port, "0.0.0.0", async () => {
  logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);

  try {
    const dbStatus = await testDbConnection();
    logger.info(`Database connected at ${dbStatus.now}`);
  } catch (error) {
    logger.error(
      `Database connection failed: ${error.message || "Unknown database error"}`
    );
    // In production, exit so the orchestrator can restart with back-off.
    if (env.isProduction) {
      process.exit(1);
    }
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const SHUTDOWN_TIMEOUT_MS = 15_000;

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown…`);

  // Stop accepting new connections.
  server.close(async () => {
    logger.info("HTTP server closed");
    await closePool();
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long.
  setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Catch fatal errors ────────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
  // In production, crash so the container restarts.
  if (env.isProduction) {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});
