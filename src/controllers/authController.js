const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { logAction } = require('../utils/auditLogger');
const { validationResult } = require('express-validator');

/**
 * Auth Controller
 * 
 * WHY: Handles user authentication and token management.
 * Implements JWT with refresh tokens for secure, scalable auth.
 */

/**
 * Register a new user
 * Note: In production, registration might require admin approval
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, fullName, role, tenantCode } = req.body;

    // Find tenant by code
    const tenant = await Tenant.findOne({ code: tenantCode.toUpperCase() });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is not active'
      });
    }

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ tenantId: tenant._id, email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this tenant'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      tenantId: tenant._id,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'student',
      status: 'pending', // Require activation
      profile: {
        fullName
      }
    });

    // Log action
    await logAction({
      tenantId: tenant._id,
      userId: user._id,
      action: 'user_registered',
      entity: 'User',
      entityId: user._id
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Account pending activation.',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, tenantCode } = req.body;

    // Find tenant
    const tenant = await Tenant.findOne({ code: tenantCode.toUpperCase() });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is suspended'
      });
    }

    // Find user
    const user = await User.findOne({
      tenantId: tenant._id,
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact administrator.`
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      userId: user._id,
      tenantId: tenant._id
    });

    // Log action
    await logAction({
      tenantId: tenant._id,
      userId: user._id,
      action: 'user_logged_in',
      entity: 'User',
      entityId: user._id
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Verify tenant still exists and is active
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant || tenant.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id,
      tenantId: tenant._id,
      role: user.role
    });

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal, server-side audit log)
 */
const logout = async (req, res, next) => {
  try {
    // Log action
    await logAction({
      tenantId: req.tenantId,
      userId: req.user._id,
      action: 'user_logged_out',
      entity: 'User',
      entityId: req.user._id
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout
};
