const { AppError, formatErrorResponse, ERROR_CODES } = require('../utils/errors');

/**
 * Error Handling Middleware
 * 
 * WHY: Centralized error handling for consistent API responses.
 * Catches all errors and formats them appropriately.
 */

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(formatErrorResponse({
      message: 'Validation error',
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors
    }, req.requestId));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json(formatErrorResponse({
      message: `${field} already exists`,
      errorCode: ERROR_CODES.DUPLICATE_ENTRY,
      metadata: { field }
    }, req.requestId));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(formatErrorResponse({
      message: 'Invalid token',
      errorCode: ERROR_CODES.INVALID_TOKEN
    }, req.requestId));
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(formatErrorResponse({
      message: 'Token expired',
      errorCode: ERROR_CODES.TOKEN_EXPIRED
    }, req.requestId));
  }

  // AppError (operational errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode || 500).json(
      formatErrorResponse(err, req.requestId)
    );
  }

  // Default error (programming errors)
  res.status(err.status || 500).json(formatErrorResponse({
    message: err.message || 'Internal server error',
    errorCode: ERROR_CODES.INTERNAL_ERROR
  }, req.requestId));
};

module.exports = errorHandler;
