import { AppError } from "../utils/app-error.js";

const roleMiddleware = (roles = []) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication is required", 401));
  }
  console.log("middleware",req.user);
  console.log("middleware role",req.user.role);
  if (!roles.includes(req.user.role)) {
    return next(new AppError("You are not authorized to access this resource", 403));
  }

  return next();
};

export default roleMiddleware;
