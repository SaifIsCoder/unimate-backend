const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

/**
 * Authentication Middleware
 * 
 * WHY: Verifies JWT token and extracts user/tenant info.
 * Token must be valid and user/tenant must be active.
 * Never trust client-provided tenantId - always extract from verified token.
 */

/**
 * Authenticate user via JWT token
 * Attaches req.user and req.tenantId to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Verify user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User account is not active'
      });
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) {
      return res.status(401).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is suspended'
      });
    }

    // Verify tenantId matches (security check)
    if (user.tenantId.toString() !== decoded.tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Tenant mismatch'
      });
    }

    // Attach user and tenant info to request
    req.user = user;
    req.tenantId = decoded.tenantId; // From verified token, never from client
    req.userRole = decoded.role; // From verified token, never from client

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = {
  authenticate
};
