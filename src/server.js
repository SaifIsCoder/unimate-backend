import app from "./app.js";
import env from "./config/env.js";
import * as logger from "./config/logger.js";
import { testDbConnection } from "./config/db.js";

app.listen(env.port, async () => {
  logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);

  try {
    const dbStatus = await testDbConnection();
    logger.info(`Database connected at ${dbStatus.now}`);
  } catch (error) {
    logger.error(`Database connection failed: ${error.message || "Unknown database error"}`);
  }
});
