import { AppError } from "../utils/app-error.js";
import { hasRole } from "../constants/roles.js";
import logger from "../config/logger.js";

const roleMiddleware = (roles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication is required", 401));
  }
  if (!hasRole(req.user.role, roles)) {
    logger.warn({
      event: "FORBIDDEN_ACCESS",
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: roles,
      url: req.originalUrl,
      method: req.method,
    }, "Unauthorized role-based access attempt");
    return next(new AppError("You are not authorized to access this resource", 403));
  }

  return next();
};

export default roleMiddleware;
