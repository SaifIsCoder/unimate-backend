const { v4: uuidv4 } = require('uuid');

/**
 * Request ID Middleware
 * 
 * WHY: Inject unique request ID for tracing and debugging.
 * Helps correlate logs across services and track request flow.
 */

const requestId = (req, res, next) => {
  // Generate or use existing request ID
  req.requestId = req.headers['x-request-id'] || uuidv4();
  
  // Add to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

module.exports = requestId;
