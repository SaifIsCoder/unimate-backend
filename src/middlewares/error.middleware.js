import { sendError } from "../utils/response.js";
import * as logger from "../config/logger.js";
import env from "../config/env.js";

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
  const message = isOperational
    ? dbErrorMessages[err.code] || err.message
    : "Internal server error";

  // Logging — never log tokens or auth headers
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    requestId: req.id,
    // Only include the error code, never the full query or params
    ...(err.code ? { pgCode: err.code } : {}),
  };

  if (statusCode >= 500 || !isOperational) {
    logger.error(
      { ...logContext, err: { message: err.message, stack: err.stack } },
      `Unhandled error: ${err.message}`
    );
  } else {
    logger.warn(logContext, `[${req.method}] ${req.originalUrl} - ${statusCode}: ${err.message}`);
  }

  // Never expose DB error codes or stack traces in production responses
  return sendError(
    res,
    message,
    statusCode,
    isOperational ? "OperationalError" : "InternalError",
    // Only expose error code in development
    env.isProduction ? undefined : err.code
  );
};
