import express from "express";
import { rateLimit } from "express-rate-limit";
import asyncHandler from "../../utils/asyncHandler.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import * as controller from "./auth.controller.js";
import {
  emptyQuery,
  loginBody,
  resetPasswordBody,
} from "./auth.validation.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 login requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts from this IP, please try again after 15 minutes",
});

router.post(
  "/login/admin",
  loginLimiter,
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginAdmin),
);

router.post(
  "/login/student",
  loginLimiter,
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginStudent),
);

router.post(
  "/login/teacher",
  loginLimiter,
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginTeacher),
);

// Protected: one-time password reset (student / teacher only)
router.post(
  "/reset-password",
  authMiddleware,
  validate({ query: emptyQuery, body: resetPasswordBody }),
  asyncHandler(controller.resetPassword),
);

// ── Unified Mobile & Frontend Integration Routes ───────────────────────────────

router.post(
  "/login",
  loginLimiter,
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginUnified),
);

router.post(
  "/refresh",
  asyncHandler(controller.refreshUnified),
);

router.post(
  "/refresh-token",
  asyncHandler(controller.refreshUnified),
);

router.post(
  "/logout",
  asyncHandler(controller.logoutUnified),
);

router.post(
  "/set-password",
  authMiddleware,
  asyncHandler(controller.setPassword),
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler(controller.getMe),
);

export default router;
