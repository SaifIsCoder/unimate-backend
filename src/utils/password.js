const bcrypt = require('bcryptjs');

/**
 * Password Utility Functions
 * 
 * WHY: Centralized password hashing and verification.
 * Uses bcrypt for secure password storage.
 */

/**
 * Hash a password
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify a password
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Boolean} True if password matches
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  verifyPassword
};
