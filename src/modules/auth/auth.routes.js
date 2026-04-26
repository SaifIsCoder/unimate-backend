import express from "express";
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

router.post(
  "/login/admin",
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginAdmin),
);

router.post(
  "/login/student",
  validate({ query: emptyQuery, body: loginBody }),
  asyncHandler(controller.loginStudent),
);

router.post(
  "/login/teacher",
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

export default router;
