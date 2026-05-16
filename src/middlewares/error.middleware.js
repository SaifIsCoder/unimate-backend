import { sendError } from "../utils/response.js";
import * as logger from "../config/logger.js";

const dbErrorMessages = {
  23505: "Record already exists",
  23503: "Referenced record does not exist",
  23502: "Missing required database field",
  "22P02": "Invalid ID format",
  "42703": "Database schema mismatch. Check column names used by the API.",
};

export default (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isKnownDbError = Boolean(dbErrorMessages[err.code]);
  const statusCode = err.statusCode || (isKnownDbError ? 400 : 500);
  
  // Production safe message
  const isOperational = err.isOperational || isKnownDbError;
  const message = isOperational ? (dbErrorMessages[err.code] || err.message) : "Internal server error";

  // Development Logging
  if (statusCode >= 500 || !isOperational) {
    logger.error(`[${req.method}] ${req.url} - ${statusCode}: ${err.message}`);
    if (err.stack) {
      logger.error(err.stack);
    }
  } else {
    // For expected 4xx errors, just a simple one-line warning
    logger.warn(`[${req.method}] ${req.url} - ${statusCode}: ${err.message}`);
  }

  return sendError(
    res,
    message,
    statusCode,
    isOperational ? "OperationalError" : "InternalError",
    err.code
  );
};
