import express from "express";
import { ADMIN, TEACHER } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./teacher.controller.js";
import { createTeacherBody, emptyQuery, idParams, updateTeacherBody } from "./teacher.validation.js";

const router = express.Router();

router.use(authMiddleware);

// Self-access: teacher role only
router.get(
  "/me",
  roleMiddleware([TEACHER]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getMe),
);
router.get(
  "/me/offerings",
  roleMiddleware([TEACHER]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getMyOfferings),
);

// Admin-only routes
router.post(
  "/",
  roleMiddleware([ADMIN]),
  validate({ query: emptyQuery, body: createTeacherBody }),
  asyncHandler(controller.createTeacher),
);
router.get(
  "/",
  roleMiddleware([ADMIN]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getTeachers),
);
router.get(
  "/:id/offerings",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getTeacherOfferings),
);
router.get(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getTeacherById),
);
router.patch(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery, body: updateTeacherBody }),
  asyncHandler(controller.updateTeacher),
);

export default router;
