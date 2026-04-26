import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication token is required", 401));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch {
    return next(new AppError("Invalid or expired authentication token", 401));
  }
};

export default authMiddleware;
