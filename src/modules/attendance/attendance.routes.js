import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as attendanceController from "./attendance.controller.js";
import * as validation from "./attendance.validation.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/my/summary",
  roleMiddleware(["student"]),
  asyncHandler(attendanceController.getMyAttendanceSummary)
);

// Alias: the mobile client is configured to call GET /attendance/my
router.get(
  "/my",
  roleMiddleware(["student"]),
  asyncHandler(attendanceController.getMyAttendanceSummary)
);

router.post(
  "/",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.recordAttendanceSchema }),
  asyncHandler(attendanceController.recordAttendance)
);

router.post(
  "/sessions",
  roleMiddleware(["admin", "teacher"]),
  validate({ body: validation.createSessionSchema }),
  asyncHandler(attendanceController.createSession)
);

router.get(
  "/offering/:offeringId/sessions",
  roleMiddleware(["admin", "teacher", "student"]),
  validate({ params: validation.offeringIdParams }),
  asyncHandler(attendanceController.getSessionsByOffering)
);

router.get(
  "/session/:sessionId",
  roleMiddleware(["admin", "teacher", "student"]),
  validate({ params: validation.sessionIdParams }),
  asyncHandler(attendanceController.getSessionRecords)
);

router.get(
  "/offering/:offeringId",
  roleMiddleware(["admin", "teacher", "student"]),
  validate({ params: validation.offeringIdParams, query: validation.paginationQuery }),
  asyncHandler(attendanceController.getAttendanceStats)
);

router.get(
  "/my/history/:offeringId",
  roleMiddleware(["student"]),
  validate({ params: validation.offeringIdParams }),
  asyncHandler(attendanceController.getMyAttendanceHistory)
);

export default router;
