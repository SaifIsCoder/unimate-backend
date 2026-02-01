/**
 * Request Logging Middleware
 * 
 * WHY: Logs all API requests for debugging and monitoring.
 * Non-blocking and lightweight.
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = requestLogger;
