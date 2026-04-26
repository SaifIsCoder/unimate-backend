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
  const message =
    dbErrorMessages[err.code] ||
    (statusCode >= 500 ? "Internal server error" : err.message) ||
    "Internal server error";

  if (statusCode >= 500) {
    logger.error(err.stack || err.message || err);
  }

  return sendError(res, message, statusCode);
};
