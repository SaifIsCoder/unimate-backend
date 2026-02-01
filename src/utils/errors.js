/**
 * Structured Error Utilities
 * 
 * WHY: Consistent error responses across all APIs.
 * Error codes enable programmatic error handling.
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode, metadata = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.metadata = metadata;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes
const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  NOT_ENROLLED: 'NOT_ENROLLED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Not Found
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Business Logic
  INVALID_OPERATION: 'INVALID_OPERATION',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {String} requestId - Request ID for tracing
 * @returns {Object} Formatted error response
 */
const formatErrorResponse = (error, requestId) => {
  const response = {
    success: false,
    error: {
      code: error.errorCode || ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'An error occurred',
      ...(requestId && { requestId })
    }
  };

  // Add metadata if available
  if (error.metadata && Object.keys(error.metadata).length > 0) {
    response.error.metadata = error.metadata;
  }

  // Add validation errors if available
  if (error.errors) {
    response.error.errors = error.errors;
  }

  return response;
};

module.exports = {
  AppError,
  ERROR_CODES,
  formatErrorResponse
};
