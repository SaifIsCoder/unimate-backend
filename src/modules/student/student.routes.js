import express from "express";
import { ADMIN, STUDENT } from "../../constants/roles.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as controller from "./student.controller.js";
import { createStudentBody, emptyQuery, idParams, updateStudentBody } from "./student.validation.js";

const router = express.Router();

router.use(authMiddleware);


// Self-access: student role only
router.get(
  "/me",
  roleMiddleware([STUDENT]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getMe),
);
router.get(
  "/me/enrollments",
  roleMiddleware([STUDENT]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getMyEnrollments),
);

// Admin-only routes
router.get(
  "/",
  roleMiddleware([ADMIN]),
  validate({ query: emptyQuery }),
  asyncHandler(controller.getStudents),
);
router.get(
  "/semester/:semester",
  roleMiddleware([ADMIN]),
  asyncHandler(controller.getStudentsBySemester),
);
router.get(
  "/:id/enrollments",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getStudentEnrollments),
);
router.get(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.getStudentById),
);
router.patch(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery, body: updateStudentBody }),
  asyncHandler(controller.updateStudent),
);

router.delete(
  "/:id",
  roleMiddleware([ADMIN]),
  validate({ params: idParams, query: emptyQuery }),
  asyncHandler(controller.deleteStudent),
);

export default router;
