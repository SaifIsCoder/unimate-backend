import { sendError } from "../utils/response.js";

export default (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return sendError(res, message, statusCode, err.errors || null);
};
