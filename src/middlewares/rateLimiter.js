const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * 
 * WHY: Prevent abuse and protect system resources.
 * Tenant-based rate limiting ensures fair usage.
 */

/**
 * Create tenant-aware rate limiter
 * @param {Object} options - Rate limit options
 */
const createTenantRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // requests per window
    message = 'Too many requests, please try again later'
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message
      }
    },
    // Use tenantId + IP as key for tenant-aware limiting
    keyGenerator: (req) => {
      const tenantId = req.tenantId?.toString() || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;
      return `${tenantId}:${ip}`;
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Global rate limiter
const globalLimiter = createTenantRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Strict rate limiter for auth endpoints
const authLimiter = createTenantRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later'
});

module.exports = {
  createTenantRateLimiter,
  globalLimiter,
  authLimiter
};
