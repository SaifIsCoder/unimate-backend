import app from "./app.js";
import env from "./config/env.js";
import * as logger from "./config/logger.js";

app.listen(env.port, () => {
  logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
});
