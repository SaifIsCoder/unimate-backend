import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import * as authRepository from "../modules/auth/auth.repository.js";

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication token is required", 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    
    // Check if user still exists and is active
    const user = await authRepository.findUserById(payload.id);
    if (!user) {
      return next(new AppError("User account no longer exists", 401));
    }

    if (!user.is_active) {
      return next(new AppError("Your account has been deactivated", 403));
    }

    req.user = {
      id: user.id,
      role: user.role,
    };

    return next();
  } catch {
    return next(new AppError("Invalid or expired authentication token", 401));
  }
};

export default authMiddleware;
