const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 * 
 * WHY: Centralized token generation and verification.
 * Tokens embed tenantId and role for middleware to extract.
 * Access tokens are short-lived, refresh tokens rotate for security.
 */

/**
 * Generate access token
 * @param {Object} payload - { userId, tenantId, role }
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role
    },
    process.env.JWT_ACCESS_SECRET || '234624536875675768543234567890',
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
    }
  );
};

/**
 * Generate refresh token
 * @param {Object} payload - { userId, tenantId }
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      tenantId: payload.tenantId
    },
    process.env.JWT_REFRESH_SECRET || '98765432109876543210987654321098',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
    }
  );
};

/**
 * Verify access token
 * @param {String} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || '234624536875675768543234567890');
};

/**
 * Verify refresh token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || '98765432109876543210987654321098');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
